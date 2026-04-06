"use client";

import React from "react";

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

const defaultColors = ["var(--primary)", "var(--secondary)", "var(--success)", "var(--warning)", "var(--danger)", "var(--info)"];

export function BarChart({ data, title, description, height = 260 }: { data: ChartData[]; title?: string; description?: string; height?: number }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-4">
      {title ? <div><h3 className="app-title text-base font-semibold">{title}</h3>{description ? <p className="app-text-secondary mt-1 text-sm leading-6">{description}</p> : null}</div> : null}
      <div className="app-surface-muted flex items-end gap-3 rounded-[var(--radius-panel)] p-4" style={{ height }}>
        {data.map((item, index) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-2" title={`${item.label}: ${item.value}`}>
            <div className="w-full rounded-[0.9rem] bg-[var(--surface)]/40 p-1">
              <div className="chart-bar" style={{ height: `${Math.max(18, (item.value / maxValue) * (height - 92))}px`, background: item.color || defaultColors[index % defaultColors.length] }} />
            </div>
            <span className="line-clamp-2 text-center text-xs text-[var(--text-secondary)]">{item.label}</span>
            <span className="app-number text-xs font-semibold text-[var(--text-primary)]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PieChart({ data, title, description, size = 180 }: { data: ChartData[]; title?: string; description?: string; size?: number }) {
  const total = Math.max(1, data.reduce((sum, item) => sum + item.value, 0));
  let currentAngle = 0;

  const segments = data.map((item, index) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = 100 + 100 * Math.cos(startRad);
    const y1 = 100 + 100 * Math.sin(startRad);
    const x2 = 100 + 100 * Math.cos(endRad);
    const y2 = 100 + 100 * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;

    return {
      path: `M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: item.color || defaultColors[index % defaultColors.length],
      label: item.label,
      value: item.value,
      percentage: ((item.value / total) * 100).toFixed(1)
    };
  });

  return (
    <div className="space-y-4">
      {title ? <div><h3 className="app-title text-base font-semibold">{title}</h3>{description ? <p className="app-text-secondary mt-1 text-sm leading-6">{description}</p> : null}</div> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <svg width={size} height={size} viewBox="0 0 200 200" className="chart-donut shrink-0">
          {segments.map((segment) => (
            <path key={segment.label} d={segment.path} fill={segment.color} stroke="var(--surface)" strokeWidth="2" />
          ))}
          <circle cx="100" cy="100" r="48" fill="var(--surface)" opacity="0.95" />
          <text x="100" y="94" textAnchor="middle" className="app-number" style={{ fill: 'var(--text-primary)', fontSize: '18px', fontWeight: 700 }}>
            {total}
          </text>
          <text x="100" y="114" textAnchor="middle" style={{ fill: 'var(--text-secondary)', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            itens
          </text>
        </svg>
        <div className="space-y-2">
          {segments.map((segment) => (
            <div key={segment.label} className="chart-legend-item flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: segment.color }} />
                <span>{segment.label}</span>
              </div>
              <span className="app-number text-xs font-semibold text-[var(--text-primary)]">{segment.value} · {segment.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
