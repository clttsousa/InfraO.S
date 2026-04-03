"use client";

import React from "react";

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

const defaultColors = ["var(--primary)", "var(--secondary)", "var(--success)", "var(--warning)", "var(--danger)", "var(--info)"];

export function BarChart({ data, title, height = 260 }: { data: ChartData[]; title?: string; height?: number }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-4">
      {title ? <h3 className="app-title text-base font-semibold">{title}</h3> : null}
      <div className="app-surface-muted flex items-end gap-3 rounded-[var(--radius-panel)] p-4" style={{ height }}>
        {data.map((item, index) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-2" title={`${item.label}: ${item.value}`}>
            <div className="w-full rounded-t-[0.7rem]" style={{ height: `${Math.max(18, (item.value / maxValue) * (height - 74))}px`, background: item.color || defaultColors[index % defaultColors.length] }} />
            <span className="line-clamp-2 text-center text-xs text-[var(--text-secondary)]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PieChart({ data, title, size = 180 }: { data: ChartData[]; title?: string; size?: number }) {
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
      percentage: ((item.value / total) * 100).toFixed(1)
    };
  });

  return (
    <div className="space-y-4">
      {title ? <h3 className="app-title text-base font-semibold">{title}</h3> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <svg width={size} height={size} viewBox="0 0 200 200" className="shrink-0">
          {segments.map((segment) => (
            <path key={segment.label} d={segment.path} fill={segment.color} stroke="var(--surface)" strokeWidth="2" />
          ))}
        </svg>
        <div className="space-y-2">
          {segments.map((segment) => (
            <div key={segment.label} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span className="h-3 w-3 rounded-full" style={{ background: segment.color }} />
              <span>{segment.label}: {segment.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
