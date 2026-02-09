import React from 'react';

interface BraidingSwatchProps {
  /** Up to 4 hex colors for the braiding strands */
  colors: string[];
  size?: number;
  className?: string;
}

/**
 * Renders a realistic woven / braided pattern with interlocking strands,
 * similar to a basket weave. Colors map to alternating warp/weft strands.
 */
const BraidingSwatch = ({ colors, size = 48, className = '' }: BraidingSwatchProps) => {
  const validColors = colors.filter(Boolean).slice(0, 4);
  if (validColors.length === 0) return null;

  // Assign colors to warp (vertical) and weft (horizontal)
  const c1 = validColors[0];
  const c2 = validColors[1] || validColors[0];
  const c3 = validColors[2] || c1;
  const c4 = validColors[3] || c2;

  const w = size;
  const h = size;

  // Grid settings for the weave
  const cols = 5;
  const rows = 6;
  const strandW = w / cols;
  const strandH = h / rows;
  const gap = Math.max(0.5, size * 0.02);
  const rx = Math.max(0.5, size * 0.03);

  // Build weave: alternating over/under pattern
  const backStrands: React.ReactNode[] = [];
  const frontStrands: React.ReactNode[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const isWarp = (row + col) % 2 === 0; // over or under
      const x = col * strandW + gap / 2;
      const y = row * strandH + gap / 2;
      const sw = strandW - gap;
      const sh = strandH - gap;

      // Diagonal offset for woven look
      const offsetX = (row % 2) * (strandW * 0.5);

      const color = isWarp
        ? (col % 2 === 0 ? c1 : c3)
        : (row % 2 === 0 ? c2 : c4);

      const rect = (
        <rect
          key={`${row}-${col}`}
          x={x + offsetX}
          y={y}
          width={sw}
          height={sh}
          rx={rx}
          fill={color}
          opacity={isWarp ? 0.95 : 0.8}
        />
      );

      if (isWarp) {
        frontStrands.push(rect);
      } else {
        backStrands.push(rect);
      }
    }
  }

  return (
    <span className={`inline-block flex-shrink-0 ${className}`}>
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w + strandW * 0.5} ${h}`}
        className="rounded-full border border-foreground/15 overflow-hidden"
        style={{ background: 'hsl(var(--secondary) / 0.5)' }}
      >
        {backStrands}
        {frontStrands}
      </svg>
    </span>
  );
};

export default BraidingSwatch;
