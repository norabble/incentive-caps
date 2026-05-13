function fmtM(v) {
  if (v == null || isNaN(v)) return '—';
  if (v >= 1000) return `$${(v / 1000).toFixed(2)}T`;
  return `$${v.toFixed(1)}M`;
}

function Card({ title, data, baseline }) {
  const worse = (key) =>
    baseline && data[key] != null && data[key] > baseline[key] * 1.001;

  return (
    <div className="metric-card">
      <div className="metric-card-title">{title}</div>
      <Row label="Company optimum"  value={data.xCompany}       warn={false} />
      <Row label="Societal optimum" value={data.xSociety}       warn={worse('xSociety')} />
      <Row label="Residual damage"  value={data.residualDamage} warn={worse('residualDamage')} />
      <Row label="Total soc. cost"  value={data.totalSocietalCost} warn={worse('totalSocietalCost')} />
    </div>
  );
}

function Row({ label, value, warn }) {
  return (
    <div className={`metric-row${warn ? ' warn' : ''}`}>
      <span className="metric-label">{label}</span>
      <span className="metric-value">{fmtM(value)}</span>
    </div>
  );
}

export default function MetricCards({ s1, s2, s3 }) {
  return (
    <div className="metric-cards">
      <Card title="Scenario 1 — All organic"         data={s1} baseline={null} />
      <Card title="Scenario 2 — Organic + regulated" data={s2} baseline={s1} />
      <Card title="Scenario 3 — All regulated"       data={s3} baseline={s1} />
    </div>
  );
}
