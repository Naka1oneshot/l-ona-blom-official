import React from 'react';

interface BraidingSwatchProps {
  /** Up to 4 hex colors for the braiding strands */
  colors: string[];
  size?: number;
  className?: string;
}

/**
 * Renders a visual braiding pattern with interweaving strands.
 */
const BraidingSwatch = ({ colors, size = 48, className = '' }: BraidingSwatchProps) => {
  const validColors = colors.filter(Boolean).slice(0, 4);
  if (validColors.length === 0) return null;

  const strandCount = Math.max(validColors.length, 3);
  const w = size;
  const h = size;

  // Generate braiding SVG paths
  const strands = validColors.length === 1
    ? [validColors[0], validColors[0], validColors[0]]
    : validColors.length === 2
      ? [validColors[0], validColors[1], validColors[0]]
      : validColors;

  return (
    <span className={`inline-block flex-shrink-0 ${className}`}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="rounded-full border border-foreground/15 overflow-hidden bg-secondary/50">
        {strands.map((color, i) => {
          const totalStrands = strands.length;
          const segW = w / totalStrands;
          const offset = i * segW;
          const amplitude = segW * 0.6;
          const yStep = h / 6;

          // Create a wavy path for each strand
          const points = [];
          for (let y = 0; y <= 6; y++) {
            const xShift = y % 2 === 0 ? -amplitude : amplitude;
            points.push(`${offset + segW / 2 + xShift},${y * yStep}`);
          }

          return (
            <polyline
              key={i}
              points={points.join(' ')}
              fill="none"
              stroke={color}
              strokeWidth={segW * 0.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.9}
            />
          );
        })}
      </svg>
    </span>
  );
};

export default BraidingSwatch;
