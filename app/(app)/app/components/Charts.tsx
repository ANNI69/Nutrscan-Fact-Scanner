"use client";

import React from "react";

export function DonutChart({ value, total, size = 140, label = "" }: { value: number; total: number; size?: number; label?: string }) {
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, (value / Math.max(1, total)) * 100));
  const dash = (pct / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--background-3)" strokeWidth={12} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="var(--primary)"
        strokeWidth={12}
        fill="none"
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize={14} fill="var(--text-1)">
        {Math.round(pct)}%
      </text>
      {label && (
        <text x="50%" y={size - 8} dominantBaseline="middle" textAnchor="middle" fontSize={12} fill="var(--text-2)">
          {label}
        </text>
      )}
    </svg>
  );
}

export function BarChart({ data, width = 320, height = 120 }: { data: { label: string; value: number }[]; width?: number; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = Math.floor(width / Math.max(1, data.length));
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((d, i) => {
        const h = Math.round((d.value / max) * (height - 20));
        const x = i * barWidth + 8;
        const y = height - h - 16;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barWidth - 16} height={h} fill="var(--primary-1)" />
            <text x={x + (barWidth - 16) / 2} y={height - 4} textAnchor="middle" fontSize={10} fill="var(--text-2)">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}


