import React from "react";

interface GeneratedPlantProps {
  stage: number; // 0 seed, 1 sprout, 2 flower, 3 tree
  decorate?: number; // cumulative waters → decorations
  animate?: boolean;
}

const colors = {
  stem: "#2e7d32",
  leaf: "#43a047",
  seed: "#8d6e63",
  petal: "#ff6fb3",
  center: "#ffca28",
  trunk: "#6d4c41",
  canopy: "#66bb6a",
};

const GeneratedPlant: React.FC<GeneratedPlantProps> = ({ stage, decorate = 0, animate }) => {
  const pulse = animate ? { transform: "scale(1.02)" } : undefined;

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <svg
        width="260"
        height="240"
        viewBox="0 0 260 240"
        xmlns="http://www.w3.org/2000/svg"
        style={pulse}
      >
        {/* background sky */}
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e3f2fd" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8e6c9" />
            <stop offset="100%" stopColor="#a5d6a7" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="260" height="240" fill="url(#sky)" />
        {/* ground */}
        <ellipse cx="130" cy="210" rx="90" ry="16" fill="url(#grass)" />
        {/* pot appears when decorate >= 3 */}
        {decorate >= 3 && (
          <g>
            <rect x="92" y="186" width="76" height="18" rx="4" fill="#c06c34" />
            <rect x="96" y="178" width="68" height="10" rx="3" fill="#dd8040" />
          </g>
        )}

        {/* seed stage */}
        {stage === 0 && (
          <g>
            <ellipse cx="130" cy="180" rx="16" ry="12" fill={colors.seed} />
            <path d="M130 168 C132 170 132 176 130 178 C128 176 128 170 130 168" fill={colors.seed} />
          </g>
        )}

        {/* sprout stage */}
        {stage === 1 && (
          <g>
            <rect x="128" y="150" width="4" height="40" rx="2" fill={colors.stem} />
            <path d="M132 162 C152 150 162 150 168 158 C156 160 146 166 136 170 Z" fill={colors.leaf} />
            <path d="M128 168 C108 156 98 156 92 164 C104 166 114 172 124 176 Z" fill={colors.leaf} />
          </g>
        )}

        {/* flower stage */}
        {stage === 2 && (
          <g>
            <rect x="128" y="130" width="4" height="60" rx="2" fill={colors.stem} />
            <path d="M132 152 C152 140 162 140 168 148 C156 150 146 156 136 160 Z" fill={colors.leaf} />
            <path d="M128 160 C108 148 98 148 92 156 C104 158 114 164 124 168 Z" fill={colors.leaf} />
            <g transform="translate(130 120)">
              <circle r="16" fill={colors.center} />
              {Array.from({ length: 8 }).map((_, i) => (
                <ellipse
                  key={i}
                  cx={Math.cos((i * Math.PI) / 4) * 28}
                  cy={Math.sin((i * Math.PI) / 4) * 28}
                  rx="10"
                  ry="18"
                  fill={colors.petal}
                />
              ))}
            </g>
          </g>
        )}

        {/* tree stage */}
        {stage === 3 && (
          <g>
            <rect x="126" y="120" width="8" height="70" fill={colors.trunk} />
            <circle cx="110" cy="120" r="28" fill={colors.canopy} />
            <circle cx="150" cy="120" r="30" fill={colors.canopy} />
            <circle cx="130" cy="100" r="26" fill={colors.canopy} />
          </g>
        )}

        {/* decorations increase with decorate level */}
        {decorate >= 6 && (
          <g>
            <ellipse cx="80" cy="208" rx="10" ry="5" fill="#bdbdbd" />
            <ellipse cx="180" cy="212" rx="12" ry="6" fill="#bdbdbd" />
          </g>
        )}
        {decorate >= 12 && (
          <g>
            <circle cx="76" cy="176" r="6" fill="#66bb6a" />
            <circle cx="186" cy="172" r="6" fill="#81c784" />
            <circle cx="50" cy="188" r="5" fill="#4db6ac" />
          </g>
        )}
        {decorate >= 20 && (
          <g>
            <rect x="40" y="196" width="10" height="22" rx="2" fill="#a1887f" />
            <rect x="210" y="196" width="10" height="22" rx="2" fill="#a1887f" />
            <rect x="50" y="202" width="160" height="6" rx="3" fill="#8d6e63" />
          </g>
        )}
        {decorate >= 25 && (
          <g>
            <path d="M30 40 C60 20 90 60 120 40" stroke="#64b5f6" strokeWidth="2" fill="none" />
            <g transform="translate(120 40)">
              <circle r="4" fill="#64b5f6" />
              <circle cx="6" r="3" fill="#ba68c8" />
            </g>
          </g>
        )}
        {decorate >= 30 && (
          <g>
            <circle cx="30" cy="30" r="2" fill="#ffd54f" />
            <circle cx="220" cy="26" r="2" fill="#ffe082" />
            <circle cx="200" cy="40" r="1.8" fill="#fff59d" />
            <circle cx="40" cy="52" r="1.8" fill="#fff9c4" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default GeneratedPlant;


