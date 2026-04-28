"use client";

interface PieChart3DProps {
  massaMagra: number;
  massaGorda: number;
  percentualGordura: number;
}

export function PieChart3D({ massaMagra, massaGorda, percentualGordura }: PieChart3DProps) {
  const percentualMagra = 100 - percentualGordura;

  const cx = 160;
  const cy = 115;
  const rx = 115;
  const ry = 68;
  const depth = 32;

  const toRad = (angle: number) => (angle - 90) * (Math.PI / 180);

  const getEllipsePoint = (angle: number, radiusX: number, radiusY: number) => {
    const rad = toRad(angle);
    return {
      x: cx + radiusX * Math.cos(rad),
      y: cy + radiusY * Math.sin(rad),
    };
  };

  const endAngleMagra = (percentualMagra / 100) * 360;
  const startAngleGorda = endAngleMagra;

  const createArcPath = (startAngle: number, endAngle: number) => {
    const start = getEllipsePoint(startAngle, rx, ry);
    const end = getEllipsePoint(endAngle, rx, ry);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${rx} ${ry} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`;
  };

  const create3DSidePath = (startAngle: number, endAngle: number) => {
    const clampedStart = Math.max(startAngle, 0);
    const clampedEnd = Math.min(endAngle, 180);
    if (clampedStart >= clampedEnd) return "";
    const start = getEllipsePoint(clampedStart, rx, ry);
    const end = getEllipsePoint(clampedEnd, rx, ry);
    const largeArc = clampedEnd - clampedStart > 180 ? 1 : 0;
    return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${rx} ${ry} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} L ${end.x.toFixed(2)} ${(end.y + depth).toFixed(2)} A ${rx} ${ry} 0 ${largeArc} 0 ${start.x.toFixed(2)} ${(start.y + depth).toFixed(2)} Z`;
  };

  // Label positions at midpoint angle of each slice
  const midMagra = endAngleMagra / 2;
  const midGorda = endAngleMagra + (360 - endAngleMagra) / 2;
  const labelMagra = getEllipsePoint(midMagra, rx * 0.62, ry * 0.62);
  const labelGorda = getEllipsePoint(midGorda, rx * 0.62, ry * 0.62);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="100%" viewBox="0 0 320 230" className="max-w-sm md:max-w-md">
        <defs>
          <radialGradient id="gradMagraTop" cx="38%" cy="32%" r="62%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="100%" stopColor="#16a34a" />
          </radialGradient>
          <radialGradient id="gradGordaTop" cx="62%" cy="32%" r="62%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#d97706" />
          </radialGradient>
          <linearGradient id="gradMagraSide" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#052e16" />
          </linearGradient>
          <linearGradient id="gradGordaSide" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* 3D sides */}
        <path d={create3DSidePath(0, Math.min(endAngleMagra, 180))} fill="url(#gradMagraSide)" />
        <path d={create3DSidePath(Math.max(startAngleGorda, 0), 180)} fill="url(#gradGordaSide)" />

        {/* Top pie slices */}
        <g filter="url(#shadow)">
          <path d={createArcPath(0, endAngleMagra)} fill="url(#gradMagraTop)" stroke="#fff" strokeWidth="1.5" />
          <path d={createArcPath(startAngleGorda, 360)} fill="url(#gradGordaTop)" stroke="#fff" strokeWidth="1.5" />
        </g>

        {/* Labels inside slices */}
        {percentualMagra > 8 && (
          <>
            <text
              x={labelMagra.x}
              y={labelMagra.y + 1}
              fill="#052e16"
              fontSize="13"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {percentualMagra.toFixed(1)}%
            </text>
          </>
        )}
        {percentualGordura > 5 && (
          <text
            x={labelGorda.x}
            y={labelGorda.y + 1}
            fill="#fff"
            fontSize="13"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {percentualGordura.toFixed(1)}%
          </text>
        )}
      </svg>

      {/* Legend */}
      <div className="flex gap-8 mt-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm shadow-sm" style={{ backgroundColor: "#22c55e" }} />
          <span className="text-sm text-muted-foreground">
            M. Magra{" "}
            <span className="font-semibold text-foreground">{massaMagra.toFixed(2)} kg</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm shadow-sm" style={{ backgroundColor: "#f59e0b" }} />
          <span className="text-sm text-muted-foreground">
            M. Gorda{" "}
            <span className="font-semibold text-foreground">{massaGorda.toFixed(2)} kg</span>
          </span>
        </div>
      </div>
    </div>
  );
}
