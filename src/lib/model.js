// ─── Decay functions ──────────────────────────────────────────────────────────
// All take (x, p0, c) where x is effective spending in $M.

export const DECAY_FN = {
  logarithmic: (x, p0, c) => p0 * Math.pow(10, -x / c),
  linear:      (x, p0, c) => Math.max(0, p0 * (1 - x / c)),
  powerlaw:    (x, p0, c) => p0 / Math.pow(1 + x / c, 2),
  sigmoid:     (x, p0, c) => p0 / (1 + Math.exp((x - c) / (c / 5))),
};

// ─── Effective spending by scenario ───────────────────────────────────────────

// Scenario 2: organic up to xCo, then mixed at regEfficiency above that
// At 50% eff: x_eff = xCo + (x - xCo)*0.5 = xCo*0.5 + x*0.5  ✓ matches spec
export function xEff2(x, xCo, regEfficiency) {
  if (x <= xCo) return x;
  return xCo + (x - xCo) * regEfficiency;
}

// Scenario 3: all spending at regulatory efficiency
export function xEff3(x, regEfficiency) {
  return x * regEfficiency;
}

// ─── Total cost functions ──────────────────────────────────────────────────────

export function tcCompany(x, xEff, p0, c, dCap, fn) {
  return dCap * fn(xEff, p0, c) + x;
}

export function tcSociety(x, xEff, p0, c, dTotal, fn) {
  return dTotal * fn(xEff, p0, c) + x;
}

// ─── Numerical optimum solver ──────────────────────────────────────────────────
// Binary search for x where dTC/dx = 0 (finite-difference derivative).
// Returns x at minimum (clips to [xLo, xHi] if no interior crossing).

function findOptimum(costFn, xLo = 0.01, xHi = 3000, tol = 0.01) {
  const h = 0.01;
  const deriv = (x) => (costFn(x + h) - costFn(x - h)) / (2 * h);

  if (deriv(xLo) >= 0) return xLo;   // minimum is at zero spending
  if (deriv(xHi) <= 0) return xHi;   // minimum beyond search range

  let lo = xLo, hi = xHi;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (deriv(mid) < 0) lo = mid; else hi = mid;
    if (hi - lo < tol) break;
  }
  return (lo + hi) / 2;
}

// ─── Per-scenario solvers ──────────────────────────────────────────────────────

export function solveScenario1({ p0, c, dCap, dTotal, fn }) {
  const xCompany = findOptimum((x) => tcCompany(x, x, p0, c, dCap, fn));
  const xSociety = findOptimum((x) => tcSociety(x, x, p0, c, dTotal, fn));
  const residualDamage = dTotal * fn(xSociety, p0, c);
  const totalSocietalCost = tcSociety(xSociety, xSociety, p0, c, dTotal, fn);
  return { xCompany, xSociety, residualDamage, totalSocietalCost };
}

export function solveScenario2({ p0, c, dCap, dTotal, fn, regEfficiency }) {
  // Company optimum is organic (same as scenario 1 company)
  const xCompany = findOptimum((x) => tcCompany(x, x, p0, c, dCap, fn));
  const xKink = xCompany;

  const xSociety = findOptimum((x) =>
    tcSociety(x, xEff2(x, xKink, regEfficiency), p0, c, dTotal, fn)
  );
  const residualDamage = dTotal * fn(xEff2(xSociety, xKink, regEfficiency), p0, c);
  const totalSocietalCost = tcSociety(
    xSociety, xEff2(xSociety, xKink, regEfficiency), p0, c, dTotal, fn
  );
  return { xCompany, xSociety, residualDamage, totalSocietalCost, xKink };
}

export function solveScenario3({ p0, c, dCap, dTotal, fn, regEfficiency }) {
  const xCompany = findOptimum((x) => tcCompany(x, xEff3(x, regEfficiency), p0, c, dCap, fn));
  const xSociety = findOptimum((x) => tcSociety(x, xEff3(x, regEfficiency), p0, c, dTotal, fn));
  const residualDamage = dTotal * fn(xEff3(xSociety, regEfficiency), p0, c);
  const totalSocietalCost = tcSociety(
    xSociety, xEff3(xSociety, regEfficiency), p0, c, dTotal, fn
  );
  return { xCompany, xSociety, residualDamage, totalSocietalCost };
}

// ─── Full curve generation ─────────────────────────────────────────────────────

export function generateCurves(params) {
  const { p0, c, dCap, dTotal, fn, regEfficiency } = params;

  const s1 = solveScenario1(params);
  const s2 = solveScenario2(params);
  const s3 = solveScenario3(params);

  // Display range: 0 → 2.2× the highest societal optimum
  const xDisplayMax = Math.max(s1.xSociety, s2.xSociety, s3.xSociety) * 2.2;
  const N = 300;
  const xs = Array.from({ length: N }, (_, i) => (i / (N - 1)) * xDisplayMax);

  const companyCosts  = xs.map((x) => ({ x, y: tcCompany(x, x, p0, c, dCap, fn) }));
  const societyCosts1 = xs.map((x) => ({ x, y: tcSociety(x, x, p0, c, dTotal, fn) }));
  const societyCosts2 = xs.map((x) => ({
    x,
    y: tcSociety(x, xEff2(x, s2.xKink, regEfficiency), p0, c, dTotal, fn),
  }));
  const societyCosts3 = xs.map((x) => ({
    x,
    y: tcSociety(x, xEff3(x, regEfficiency), p0, c, dTotal, fn),
  }));

  return { xs, companyCosts, societyCosts1, societyCosts2, societyCosts3, s1, s2, s3, xDisplayMax };
}

// ─── Parameter helpers ─────────────────────────────────────────────────────────

// Map user-facing decay rate label to c (in $M).
// Larger c = slower decay (more spending needed per decade of risk reduction).
export const DECAY_RATE_C = { slow: 40, medium: 20, fast: 8 };
