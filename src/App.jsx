import { useMemo, useState } from 'react';
import ControlPanel from './components/ControlPanel';
import IncentiveChart from './components/IncentiveChart';
import MetricCards from './components/MetricCards';
import { DECAY_FN, DECAY_RATE_C, generateCurves } from './lib/model';
import './App.css';

const DEFAULTS = {
  marketCapB:    800,          // $800B company
  dTotalT:       5,            // $5T societal damage
  p0Log:         -4,           // p0 = 1e-4
  decayRate:     'medium',
  regPenaltyPct: 50,           // 50% penalty → 50% effective
  decayFnKey:    'logarithmic',
};

export default function App() {
  const [params, setParams] = useState(DEFAULTS);

  const curves = useMemo(() => {
    const { marketCapB, dTotalT, p0Log, decayRate, regPenaltyPct, decayFnKey } = params;
    return generateCurves({
      p0:            Math.pow(10, p0Log),
      c:             DECAY_RATE_C[decayRate],
      dCap:          marketCapB * 1000 * 0.5,  // 50% of market cap, in $M
      dTotal:        dTotalT * 1e6,             // $T → $M
      fn:            DECAY_FN[decayFnKey],
      regEfficiency: 1 - regPenaltyPct / 100,
    });
  }, [params]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Incentive Cap Model</h1>
        <p className="subtitle">
          Why AI companies systematically underinvest in safety — and how much it costs society.
        </p>
      </header>

      <div className="app-body">
        <ControlPanel params={params} onChange={setParams} />
        <div className="app-main">
          <MetricCards s1={curves.s1} s2={curves.s2} s3={curves.s3} />
          <IncentiveChart curves={curves} />
        </div>
      </div>
    </div>
  );
}
