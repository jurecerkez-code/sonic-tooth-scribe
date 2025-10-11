import { ToothCondition } from "@/types/dental";

interface DentalChartProps {
  teethStatus: Map<number, ToothCondition>;
  onToothClick: (toothNumber: number) => void;
}

const getToothColor = (condition: ToothCondition): string => {
  const colors: Record<ToothCondition, string> = {
    healthy: "fill-status-healthy",
    removed: "fill-status-removed",
    cavity: "fill-status-cavity",
    crown: "fill-status-crown",
    "root-canal": "fill-status-rootCanal",
    cracked: "fill-status-cracked",
    filling: "fill-status-filling",
  };
  return colors[condition];
};

const Tooth = ({ 
  number, 
  condition, 
  onClick,
  x,
  y,
  rotation = 0
}: { 
  number: number; 
  condition: ToothCondition; 
  onClick: () => void;
  x: number;
  y: number;
  rotation?: number;
}) => {
  return (
    <g 
      className="cursor-pointer transition-opacity hover:opacity-80"
      onClick={onClick}
    >
      <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
        <ellipse
          cx="0"
          cy="0"
          rx="18"
          ry="28"
          className={`${getToothColor(condition)} stroke-border stroke-2 transition-colors`}
        />
        <text
          x="0"
          y="5"
          textAnchor="middle"
          className="text-xs font-bold fill-card-foreground pointer-events-none select-none"
          style={{ fontSize: '12px' }}
        >
          {number}
        </text>
      </g>
    </g>
  );
};

export const DentalChart = ({ teethStatus, onToothClick }: DentalChartProps) => {
  // Calculate positions for teeth in a complete oval/horseshoe pattern
  const getToothPosition = (toothNum: number) => {
    const centerX = 300;
    const centerY = 250;
    const radiusX = 200;
    const radiusY = 180;
    
    // Map tooth numbers to positions around the oval
    // Upper right: 1-8, Upper left: 9-16, Lower left: 17-24, Lower right: 25-32
    let angle;
    
    if (toothNum >= 1 && toothNum <= 8) {
      // Upper right quadrant (clockwise from top)
      const position = toothNum - 1;
      angle = 270 - (position * 90 / 7); // 270° to 180°
    } else if (toothNum >= 9 && toothNum <= 16) {
      // Upper left quadrant
      const position = toothNum - 9;
      angle = 180 - (position * 90 / 7); // 180° to 90°
    } else if (toothNum >= 17 && toothNum <= 24) {
      // Lower left quadrant
      const position = toothNum - 17;
      angle = 90 - (position * 90 / 7); // 90° to 0°
    } else {
      // Lower right quadrant (25-32)
      const position = toothNum - 25;
      angle = 360 - (position * 90 / 7); // 360° to 270°
    }
    
    const angleRad = (angle * Math.PI) / 180;
    const x = centerX + radiusX * Math.cos(angleRad);
    const y = centerY + radiusY * Math.sin(angleRad);
    
    // Rotation to point outward from center
    const rotation = angle - 90;
    
    return { x, y, rotation };
  };

  const allTeeth = Array.from({ length: 32 }, (_, i) => i + 1);

  return (
    <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground text-center mb-6">
          Dental Chart
        </h3>
        
        {/* Single oval chart with all teeth */}
        <div className="relative">
          <svg viewBox="0 0 600 500" className="w-full" style={{ maxHeight: '500px' }}>
            {/* Labels */}
            <text x="500" y="120" textAnchor="middle" className="text-sm fill-muted-foreground font-semibold">
              Upper right
            </text>
            <text x="100" y="120" textAnchor="middle" className="text-sm fill-muted-foreground font-semibold">
              Upper left
            </text>
            <text x="500" y="390" textAnchor="middle" className="text-sm fill-muted-foreground font-semibold">
              Lower right
            </text>
            <text x="100" y="390" textAnchor="middle" className="text-sm fill-muted-foreground font-semibold">
              Lower left
            </text>
            
            {/* All teeth in oval pattern */}
            {allTeeth.map((num) => {
              const pos = getToothPosition(num);
              return (
                <Tooth
                  key={num}
                  number={num}
                  condition={teethStatus.get(num) || "healthy"}
                  onClick={() => onToothClick(num)}
                  x={pos.x}
                  y={pos.y}
                  rotation={pos.rotation}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-border">
        <h4 className="text-sm font-semibold text-foreground mb-3">Status Legend</h4>
        <div className="grid grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-status-healthy" />
            <span className="text-xs text-muted-foreground">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-status-removed" />
            <span className="text-xs text-muted-foreground">Removed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-status-cavity" />
            <span className="text-xs text-muted-foreground">Cavity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-status-crown" />
            <span className="text-xs text-muted-foreground">Crown</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-status-rootCanal" />
            <span className="text-xs text-muted-foreground">Root Canal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-status-cracked" />
            <span className="text-xs text-muted-foreground">Cracked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-status-filling" />
            <span className="text-xs text-muted-foreground">Filling</span>
          </div>
        </div>
      </div>
    </div>
  );
};
