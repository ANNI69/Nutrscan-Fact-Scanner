"use client";

import React from "react";

type Point = { x: number; y: number };

export default function InlineSparkline({
  values,
  width = 320,
  height = 64,
  stroke = "#2563eb",
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  if (!values || values.length === 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 4;
  const xStep = (width - pad * 2) / Math.max(1, values.length - 1);
  const scaleY = (v: number) =>
    max === min
      ? height / 2
      : height - pad - ((v - min) / (max - min)) * (height - pad * 2);

  const points: Point[] = values.map((v, i) => ({
    x: pad + i * xStep,
    y: scaleY(v),
  }));
  const d = points
    .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
      />
    </svg>
  );
}


