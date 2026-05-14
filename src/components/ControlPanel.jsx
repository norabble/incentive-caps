import { DECAY_RATE_C } from '../lib/model';

function SliderRow({ label, value, min, max, step, onChange, format }) {
  return (
    <div className="slider-row">
      <div className="slider-label">
        <span>{label}</span>
        <span className="slider-value">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export default function ControlPanel({ params, onChange }) {
  const { marketCapB, dTotalT, p0Log, decayRate, regPenaltyPct, decayFnKey } = params;

  const set = (key) => (val) => onChange({ ...params, [key]: val });

  return (
    <div className="control-panel">
      <h3>Parameters</h3>

      <div className="param-section">
        <SliderRow
          label="Company market cap"
          value={marketCapB}
          min={50} max={2000} step={50}
          onChange={set('marketCapB')}
          format={(v) => `$${v}B`}
        />
        <SliderRow
          label="Societal damage D_total"
          value={dTotalT}
          min={0.5} max={50} step={0.5}
          onChange={set('dTotalT')}
          format={(v) => `$${v}T`}
        />
        <SliderRow
          label="Initial risk probability p₀"
          value={p0Log}
          min={-6} max={-2} step={0.1}
          onChange={set('p0Log')}
          format={(v) => `1 in ${(1 / Math.pow(10, v)).toLocaleString(undefined, { maximumSignificantDigits: 2 })}`}
        />
        <SliderRow
          label="Regulation efficiency penalty"
          value={regPenaltyPct}
          min={0} max={100} step={5}
          onChange={set('regPenaltyPct')}
          format={(v) => `${v}% penalty → ${100 - v}% effective`}
        />
      </div>

      <div className="param-section">
        <label className="section-label">Decay function</label>
        <div className="radio-group">
          {[
            { key: 'logarithmic', label: 'Logarithmic' },
            { key: 'linear',      label: 'Linear' },
            { key: 'powerlaw',    label: 'Power law' },
            { key: 'sigmoid',     label: 'S-curve' },
          ].map(({ key, label }) => (
            <label key={key} className="radio-option">
              <input
                type="radio"
                name="decayFn"
                value={key}
                checked={decayFnKey === key}
                onChange={() => onChange({ ...params, decayFnKey: key })}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="param-section">
        <label className="section-label">Decay rate</label>
        <div className="radio-group">
          {Object.keys(DECAY_RATE_C).map((rate) => (
            <label key={rate} className="radio-option">
              <input
                type="radio"
                name="decayRate"
                value={rate}
                checked={decayRate === rate}
                onChange={() => onChange({ ...params, decayRate: rate })}
              />
              {rate.charAt(0).toUpperCase() + rate.slice(1)}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
