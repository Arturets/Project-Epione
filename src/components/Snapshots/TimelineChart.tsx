import { component$ } from '@builder.io/qwik';

type Point = {
  label: string;
  value: number;
};

type Props = {
  points: Point[];
  title: string;
};

export const TimelineChart = component$<Props>(({ points, title }) => {
  const width = 520;
  const height = 180;
  const padding = 24;

  if (!points.length) {
    return (
      <div class="card">
        <h3>{title}</h3>
        <p class="muted">No timeline data yet.</p>
      </div>
    );
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);

  const toX = (index: number) => padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
  const toY = (value: number) => height - padding - ((value - min) / range) * (height - padding * 2);

  const line = points.map((point, index) => `${toX(index)},${toY(point.value)}`).join(' ');

  return (
    <div class="card">
      <h3>{title}</h3>
      <svg viewBox={`0 0 ${width} ${height}`} class="timeline-chart">
        <polyline points={line} fill="none" stroke="var(--chart-line)" stroke-width="3" stroke-linecap="round" />
        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={toX(index)} cy={toY(point.value)} r="4" fill="var(--chart-dot)" />
          </g>
        ))}
      </svg>
      <div class="timeline-labels">
        {points.map((point, index) => (
          <span key={`${point.label}-${index}`} class="timeline-label">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
});
