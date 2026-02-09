import React from 'react';

interface ColorSwatchProps {
  /** Up to 4 hex colors */
  colors: string[];
  size?: number;
  className?: string;
}

/**
 * Renders a circular swatch supporting 1–4 colors as pie segments.
 */
const ColorSwatch = ({ colors, size = 48, className = '' }: ColorSwatchProps) => {
  const validColors = colors.filter(Boolean).slice(0, 4);
  if (validColors.length === 0) return null;

  const r = size / 2;

  if (validColors.length === 1) {
    return (
      <span
        className={`inline-block rounded-full border border-foreground/15 flex-shrink-0 ${className}`}
        style={{ width: size, height: size, backgroundColor: validColors[0] }}
      />
    );
  }

  // Build conic-gradient segments
  const segmentAngle = 360 / validColors.length;
  const stops = validColors.map((c, i) => {
    const start = segmentAngle * i;
    const end = segmentAngle * (i + 1);
    return `${c} ${start}deg ${end}deg`;
  }).join(', ');

  return (
    <span
      className={`inline-block rounded-full border border-foreground/15 flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(from 0deg, ${stops})`,
      }}
    />
  );
};

export default ColorSwatch;
