"use client";

interface PieChart3DProps {
  massaMagra: number;
  massaGorda: number;
  percentualGordura: number;
}

/** Arco “da frente” do cilindro (parte inferior da elipse na tela): ângulos do parâmetro 90°–270°. */
const FRONT_START = 90;
const FRONT_END = 270;

export function PieChart3D({ massaMagra, massaGorda, percentualGordura }: PieChart3DProps) {
  const percentualMagra = 100 - percentualGordura;

  const cx = 160;
  const cy = 108;
  const rx = 118;
  const ry = 72;
  const depth = 44;
  const innerRx = rx * 0.42;
  const innerRy = ry * 0.42;

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

  const createArcPath = (startAngle: number, endAngle: number, rxi: number, ryi: number) => {
    const start = getEllipsePoint(startAngle, rxi, ryi);
    const end = getEllipsePoint(endAngle, rxi, ryi);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${rxi} ${ryi} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`;
  };

  /** Parede extrudada no anel externo, só no arco [a,b] ∩ [FRONT_START, FRONT_END]. */
  const createOuterWallPath = (sliceStart: number, sliceEnd: number) => {
    const a = Math.max(sliceStart, FRONT_START);
    const b = Math.min(sliceEnd, FRONT_END);
    if (a >= b) return null;
    const start = getEllipsePoint(a, rx, ry);
    const end = getEllipsePoint(b, rx, ry);
    const largeArc = b - a > 180 ? 1 : 0;
    const d = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${rx} ${ry} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} L ${end.x.toFixed(2)} ${(end.y + depth).toFixed(2)} A ${rx} ${ry} 0 ${largeArc} 0 ${start.x.toFixed(2)} ${(start.y + depth).toFixed(2)} Z`;
    return d;
  };

  const midMagra = endAngleMagra / 2;
  const midGorda = startAngleGorda + (360 - startAngleGorda) / 2;
  const labelMagra = getEllipsePoint(midMagra, rx * 0.58, ry * 0.58);
  const labelGorda = getEllipsePoint(midGorda, rx * 0.58, ry * 0.58);

  const wallMagra = createOuterWallPath(0, endAngleMagra);
  const wallGordaFront = createOuterWallPath(startAngleGorda, 360);

  return (
    <div
      className="flex flex-col items-center gap-3 [perspective:900px]"
      style={{ perspectiveOrigin: "50% 40%" }}
    >
      <div className="[transform-style:preserve-3d] [transform:rotateX(12deg)] w-full max-w-md">
        <svg width="100%" viewBox="0 0 320 248" className="drop-shadow-xl">
          <defs>
            <radialGradient id="gradMagraTop" cx="35%" cy="28%" r="65%">
              <stop offset="0%" stopColor="#bbf7d0" />
              <stop offset="45%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#14532d" />
            </radialGradient>
            <radialGradient id="gradGordaTop" cx="65%" cy="28%" r="65%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="45%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#92400e" />
            </radialGradient>
            <linearGradient id="gradMagraWall" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#166534" />
              <stop offset="50%" stopColor="#15803d" />
              <stop offset="100%" stopColor="#052e16" />
            </linearGradient>
            <linearGradient id="gradGordaWall" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="50%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
            <linearGradient id="gradBottom" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
            </linearGradient>
            <filter id="pieShadow" x="-25%" y="-15%" width="150%" height="180%">
              <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#000" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Base / sombra 3D */}
          <ellipse cx={cx} cy={cy + depth + 4} rx={rx * 1.02} ry={ry * 0.38} fill="black" opacity="0.25" />
          <ellipse cx={cx} cy={cy + depth} rx={rx} ry={ry * 0.88} fill="url(#gradBottom)" opacity="0.92" />

          {/* Paredes frontais (espessura) */}
          {wallMagra && (
            <path d={wallMagra} fill="url(#gradMagraWall)" stroke="#14532d" strokeWidth="0.5" strokeOpacity="0.5" />
          )}
          {wallGordaFront && (
            <path d={wallGordaFront} fill="url(#gradGordaWall)" stroke="#78350f" strokeWidth="0.5" strokeOpacity="0.5" />
          )}

          {/* Fatias superiores (anel: furo desenhado por cima) */}
          <g filter="url(#pieShadow)">
            <path
              d={createArcPath(0, endAngleMagra, rx, ry)}
              fill="url(#gradMagraTop)"
              stroke="#fff"
              strokeWidth="1.5"
              strokeOpacity="0.35"
            />
            <path
              d={createArcPath(startAngleGorda, 360, rx, ry)}
              fill="url(#gradGordaTop)"
              stroke="#fff"
              strokeWidth="1.5"
              strokeOpacity="0.35"
            />
          </g>

          {/* Furo central (donut) — mesma cor do card */}
          <ellipse cx={cx} cy={cy} rx={innerRx} ry={innerRy} fill="var(--card)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {percentualMagra > 8 && (
            <text
              x={labelMagra.x}
              y={labelMagra.y}
              fill="#ecfdf5"
              fontSize="14"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
            >
              {percentualMagra.toFixed(1)}%
            </text>
          )}
          {percentualGordura > 5 && (
            <text
              x={labelGorda.x}
              y={labelGorda.y}
              fill="#fffbeb"
              fontSize="14"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.55)" }}
            >
              {percentualGordura.toFixed(1)}%
            </text>
          )}
        </svg>
      </div>

      <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mt-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm shadow-sm ring-1 ring-white/20" style={{ backgroundColor: "#22c55e" }} />
          <span className="text-sm text-muted-foreground">
            M. Magra <span className="font-semibold text-foreground">{massaMagra.toFixed(2)} kg</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm shadow-sm ring-1 ring-white/20" style={{ backgroundColor: "#f59e0b" }} />
          <span className="text-sm text-muted-foreground">
            M. Gorda <span className="font-semibold text-foreground">{massaGorda.toFixed(2)} kg</span>
          </span>
        </div>
      </div>
    </div>
  );
}
