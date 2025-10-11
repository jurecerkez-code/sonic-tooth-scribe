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
  // Calculate positions for upper arch teeth (1-16)
  const getUpperToothPosition = (toothNum: number) => {
    const centerX = 300;
    const centerY = 180;
    const radiusX = 220;
    const radiusY = 110;
    
    // Position teeth 1-8 on right side, 9-16 on left side of upper arch
    let position;
    if (toothNum >= 1 && toothNum <= 8) {
      // Upper right: 1-8 (from center going right and down)
      position = toothNum - 1;
    } else {
      // Upper left: 9-16 (from center going left and down)
      position = toothNum - 9;
    }
    
    // Create horseshoe shape for upper arch (180° arc) with more spacing
    let angle;
    if (toothNum >= 1 && toothNum <= 8) {
      // Right side: -90° to -5° (more spread)
      angle = -90 + (position * 85 / 7);
    } else {
      // Left side: -175° to -90° (more spread)
      angle = -175 + (position * 85 / 7);
    }
    
    const angleRad = (angle * Math.PI) / 180;
    const x = centerX + radiusX * Math.cos(angleRad);
    const y = centerY + radiusY * Math.sin(angleRad);
    const rotation = angle + 90;
    
    return { x, y, rotation };
  };

  // Calculate positions for lower arch teeth (17-32)
  const getLowerToothPosition = (toothNum: number) => {
    const centerX = 300;
    const centerY = 320;
    const radiusX = 220;
    const radiusY = 110;
    
    // Position teeth 17-24 on left side, 25-32 on right side of lower arch
    let position;
    if (toothNum >= 17 && toothNum <= 24) {
      // Lower left: 17-24
      position = toothNum - 17;
    } else {
      // Lower right: 25-32
      position = toothNum - 25;
    }
    
    // Create horseshoe shape for lower arch (180° arc, mirrored) with more spacing
    let angle;
    if (toothNum >= 17 && toothNum <= 24) {
      // Left side: 175° to 90° (more spread)
      angle = 175 - (position * 85 / 7);
    } else {
      // Right side: 90° to 5° (more spread)
      angle = 90 - (position * 85 / 7);
    }
    
    const angleRad = (angle * Math.PI) / 180;
    const x = centerX + radiusX * Math.cos(angleRad);
    const y = centerY + radiusY * Math.sin(angleRad);
    const rotation = angle - 90;
    
    return { x, y, rotation };
  };

  const upperTeeth = Array.from({ length: 16 }, (_, i) => i + 1);
  const lowerTeeth = Array.from({ length: 16 }, (_, i) => i + 17);

  return (
    <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground text-center mb-6">
          Dental Chart
        </h3>
        
        <div className="relative">
          <svg viewBox="0 0 600 500" className="w-full" style={{ maxHeight: '500px' }}>
            {/* Labels - positioned outside teeth */}
            <text x="520" y="180" textAnchor="middle" className="text-sm fill-muted-foreground font-semibold">
              Upper Right
            </text>
            <text x="80" y="180" textAnchor="middle" className="text-sm fill-muted-foreground font-semibold">
              Upper Left
            </text>
            <text x="520" y="320" textAnchor="middle" className="text-sm fill-muted-foreground font-semibold">
              Lower Right
            </text>
            <text x="80" y="320" textAnchor="middle" className="text-sm fill-muted-foreground font-semibold">
              Lower Left
            </text>
            
            {/* Upper arch teeth */}
            {upperTeeth.map((num) => {
              const pos = getUpperToothPosition(num);
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
            
            {/* Lower arch teeth */}
            {lowerTeeth.map((num) => {
              const pos = getLowerToothPosition(num);
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
