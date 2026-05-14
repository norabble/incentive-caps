import { useEffect, useRef } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, Tooltip, Legend, Filler);

const COLORS = {
  company:   '#3b82f6', // blue
  society1:  '#9ca3af', // gray
  society2:  '#ef4444', // coral/red
  society3:  '#f59e0b', // amber
};

function fmtM(v) {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}T`;
  return `$${v.toFixed(0)}M`;
}

// Custom plugin: vertical dashed lines, kink dot, horizontal arrows
const annotationPlugin = {
  id: 'incentiveAnnotations',
  afterDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    const meta = chart.config.options._annotations;
    if (!meta) return;

    const { s1, s2, s3 } = meta;
    const xScale = scales.x;
    const yRight = scales.yRight;

    ctx.save();

    // Helper: pixel x from spending value
    const px = (v) => xScale.getPixelForValue(v);
    const pyR = (v) => yRight.getPixelForValue(v);

    const top    = chartArea.top;
    const bottom = chartArea.bottom;

    // Draw vertical dashed line + label
    function vLine(x, color, label) {
      const xPx = px(x);
      if (xPx < chartArea.left || xPx > chartArea.right) return;

      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.moveTo(xPx, top);
      ctx.lineTo(xPx, bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label above the chart area
      ctx.fillStyle = color;
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, xPx, top - 6);
    }

    // Company optimum (same across scenarios; use s1)
    vLine(s1.xCompany, COLORS.company, fmtM(s1.xCompany));

    // Societal optima
    vLine(s1.xSociety, COLORS.society1, fmtM(s1.xSociety));
    vLine(s2.xSociety, COLORS.society2, fmtM(s2.xSociety));
    vLine(s3.xSociety, COLORS.society3, fmtM(s3.xSociety));

    // Kink dot on scenario 2 curve
    if (s2.xKink != null) {
      const kinkDataset = chart.data.datasets.findIndex((d) => d.label === 'Scenario 2');
      if (kinkDataset >= 0) {
        const ds = chart.data.datasets[kinkDataset];
        const pts = ds.data;
        // Find closest x point
        const closest = pts.reduce((best, pt) =>
          Math.abs(pt.x - s2.xKink) < Math.abs(best.x - s2.xKink) ? pt : best
        );
        ctx.beginPath();
        ctx.arc(px(closest.x), pyR(closest.y), 5, 0, 2 * Math.PI);
        ctx.fillStyle = COLORS.society2;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Horizontal arrows between adjacent societal optima (drawn above chart)
    function hArrow(x1, x2, color, y) {
      const px1 = px(x1), px2 = px(x2);
      if (Math.abs(px2 - px1) < 4) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      // shaft
      ctx.moveTo(px1, y);
      ctx.lineTo(px2, y);
      ctx.stroke();
      // arrowhead
      const dir = px2 > px1 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(px2, y);
      ctx.lineTo(px2 - dir * 7, y - 4);
      ctx.lineTo(px2 - dir * 7, y + 4);
      ctx.closePath();
      ctx.fill();

      // label
      const midX = (px1 + px2) / 2;
      const diff = Math.abs(x2 - x1);
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`+${fmtM(diff)}`, midX, y - 7);
    }

    const arrowY = top - 18;
    if (s1.xSociety < s2.xSociety) hArrow(s1.xSociety, s2.xSociety, COLORS.society2, arrowY);
    if (s2.xSociety < s3.xSociety) hArrow(s2.xSociety, s3.xSociety, COLORS.society3, arrowY);

    ctx.restore();
  },
};

Chart.register(annotationPlugin);

function buildChartConfig(curves) {
  const { companyCosts, societyCosts1, societyCosts2, societyCosts3, s1, s2, s3 } = curves;

  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const gridColor  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const labelColor = isDark ? '#d1d5db' : '#374151';

  const maxCompany = Math.max(...companyCosts.map((p) => p.y));
  const maxSociety = Math.max(
    ...societyCosts1.map((p) => p.y),
    ...societyCosts2.map((p) => p.y),
    ...societyCosts3.map((p) => p.y),
  );

  return {
    data: {
      datasets: [
        {
          label: 'Company cost',
          data: companyCosts,
          borderColor: COLORS.company,
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          pointRadius: 0,
          tension: 0.1,
          yAxisID: 'yLeft',
        },
        {
          label: 'Scenario 1 (all organic)',
          data: societyCosts1,
          borderColor: COLORS.society1,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderDash: [6, 3],
          pointRadius: 0,
          tension: 0.1,
          yAxisID: 'yRight',
        },
        {
          label: 'Scenario 2',
          data: societyCosts2,
          borderColor: COLORS.society2,
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          pointRadius: 0,
          tension: 0,
          yAxisID: 'yRight',
        },
        {
          label: 'Scenario 3 (all regulated)',
          data: societyCosts3,
          borderColor: COLORS.society3,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [4, 3],
          pointRadius: 0,
          tension: 0.1,
          yAxisID: 'yRight',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 200 },
      layout: { padding: { top: 36, right: 16 } },
      parsing: false,
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Safety spending x ($M)', color: labelColor },
          ticks: { color: labelColor, callback: (v) => `$${v}M` },
          grid: { color: gridColor },
        },
        yLeft: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Company total cost ($M)', color: COLORS.company },
          ticks: { color: COLORS.company, callback: (v) => `$${v.toFixed(0)}M` },
          grid: { color: gridColor },
          max: maxCompany * 1.05,
          min: 0,
        },
        yRight: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: 'Societal total cost ($M)', color: COLORS.society2 },
          ticks: { color: labelColor, callback: (v) => `$${v.toFixed(0)}M` },
          grid: { drawOnChartArea: false },
          max: maxSociety * 1.05,
          min: 0,
        },
      },
      plugins: {
        legend: {
          labels: { color: labelColor, usePointStyle: true, pointStyleWidth: 16 },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: ([item]) => `x = $${Number(item.label).toFixed(1)}M`,
            label: (item) => ` ${item.dataset.label}: $${item.raw.y.toFixed(1)}M`,
          },
        },
        _annotations: { s1, s2, s3 },
      },
    },
  };
}

export default function IncentiveChart({ curves }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  // Create chart once; null ref on cleanup so remounts start fresh.
  useEffect(() => {
    const chart = new Chart(canvasRef.current, {
      type: 'line',
      data: { datasets: [] },
      options: { responsive: true, maintainAspectRatio: false },
    });
    chartRef.current = chart;
    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, []);

  // Update data whenever curves change (runs after the create effect on mount).
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !curves) return;
    const { data, options } = buildChartConfig(curves);
    chart.data = data;
    chart.options = options;
    chart.update('none');
  }, [curves]);

  return (
    <div className="chart-wrapper">
      <canvas ref={canvasRef} />
    </div>
  );
}
