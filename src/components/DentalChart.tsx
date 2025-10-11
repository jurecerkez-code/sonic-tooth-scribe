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

type ToothType = "molar" | "premolar" | "canine" | "incisor";

const getToothType = (toothNumber: number): ToothType => {
  // Molars: 1-3, 14-16, 17-19, 30-32
  if ([1, 2, 3, 14, 15, 16, 17, 18, 19, 30, 31, 32].includes(toothNumber)) {
    return "molar";
  }
  // Premolars: 4-5, 12-13, 20-21, 28-29
  if ([4, 5, 12, 13, 20, 21, 28, 29].includes(toothNumber)) {
    return "premolar";
  }
  // Canines: 6, 11, 22, 27
  if ([6, 11, 22, 27].includes(toothNumber)) {
    return "canine";
  }
  // Incisors: 7-10, 23-26
  return "incisor";
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
  const toothType = getToothType(number);
  const fillColor = getToothColor(condition);
  
  const renderToothShape = () => {
    switch (toothType) {
      case "molar":
        // Wide crown with multiple cusps and roots
        return (
          <g>
            {/* Crown */}
            <path
              d="M -12,-15 Q -12,-25 -8,-28 Q -4,-30 0,-30 Q 4,-30 8,-28 Q 12,-25 12,-15 L 10,-5 Q 8,0 4,2 L 2,10 Q 1,15 0,15 Q -1,15 -2,10 L -4,2 Q -8,0 -10,-5 Z"
              className={`${fillColor} stroke-border stroke-[1.5] transition-colors`}
            />
            {/* Roots */}
            <path
              d="M -6,15 L -8,35 M 0,15 L 0,35 M 6,15 L 8,35"
              className="stroke-border stroke-[1.5] fill-none"
            />
          </g>
        );
      
      case "premolar":
        // Medium crown with two cusps and roots
        return (
          <g>
            {/* Crown */}
            <path
              d="M -9,-15 Q -9,-25 -5,-28 Q 0,-30 5,-28 Q 9,-25 9,-15 L 7,-5 Q 5,0 2,2 L 1,10 Q 0,12 0,12 Q 0,12 -1,10 L -2,2 Q -5,0 -7,-5 Z"
              className={`${fillColor} stroke-border stroke-[1.5] transition-colors`}
            />
            {/* Roots */}
            <path
              d="M -3,12 L -4,32 M 3,12 L 4,32"
              className="stroke-border stroke-[1.5] fill-none"
            />
          </g>
        );
      
      case "canine":
        // Pointed crown with single root
        return (
          <g>
            {/* Crown */}
            <path
              d="M -7,-12 Q -7,-25 -4,-28 Q 0,-32 4,-28 Q 7,-25 7,-12 L 5,-5 Q 3,0 1,5 L 0,8 L -1,5 Q -3,0 -5,-5 Z"
              className={`${fillColor} stroke-border stroke-[1.5] transition-colors`}
            />
            {/* Root */}
            <path
              d="M 0,8 L 0,35"
              className="stroke-border stroke-[1.5] fill-none"
            />
          </g>
        );
      
      case "incisor":
        // Narrow rectangular crown with single root
        return (
          <g>
            {/* Crown */}
            <path
              d="M -6,-15 Q -6,-27 -3,-29 Q 0,-30 3,-29 Q 6,-27 6,-15 L 5,-5 Q 3,0 1,5 L 0,8 L -1,5 Q -3,0 -5,-5 Z"
              className={`${fillColor} stroke-border stroke-[1.5] transition-colors`}
            />
            {/* Root */}
            <path
              d="M 0,8 L 0,30"
              className="stroke-border stroke-[1.5] fill-none"
            />
          </g>
        );
    }
  };
  
  return (
    <g 
      className="cursor-pointer transition-opacity hover:opacity-80"
      onClick={onClick}
    >
      <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
        {renderToothShape()}
        <text
          x="0"
          y="-8"
          textAnchor="middle"
          className="text-[9px] font-bold fill-card-foreground pointer-events-none select-none"
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
    const centerY = 160;
    const radiusX = 200;
    const radiusY = 90;
    
    // Position teeth 1-8 on right side, 9-16 on left side of upper arch
    let position;
    if (toothNum >= 1 && toothNum <= 8) {
      // Upper right: 1-8 (from center going right and down)
      position = toothNum - 1;
    } else {
      // Upper left: 9-16 (from center going left and down)
      position = toothNum - 9;
    }
    
    // Create horseshoe shape for upper arch
    let angle;
    if (toothNum >= 1 && toothNum <= 8) {
      // Right side: -80° to 0°
      angle = -80 + (position * 80 / 7);
    } else {
      // Left side: -180° to -100°
      angle = -180 + (position * 80 / 7);
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
    const centerY = 340;
    const radiusX = 200;
    const radiusY = 90;
    
    // Position teeth 17-24 on left side, 25-32 on right side of lower arch
    let position;
    if (toothNum >= 17 && toothNum <= 24) {
      // Lower left: 17-24
      position = toothNum - 17;
    } else {
      // Lower right: 25-32
      position = toothNum - 25;
    }
    
    // Create horseshoe shape for lower arch (mirrored)
    let angle;
    if (toothNum >= 17 && toothNum <= 24) {
      // Left side: 180° to 100°
      angle = 180 - (position * 80 / 7);
    } else {
      // Right side: 80° to 0°
      angle = 80 - (position * 80 / 7);
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
            {/* Labels */}
            <text x="500" y="140" textAnchor="middle" className="text-sm fill-muted-foreground font-semibold">
              Upper right
            </text>
            <text x="100" y="140" textAnchor="middle" className="text-sm fill-muted-foreground font-semibold">
              Upper left
            </text>
            <text x="500" y="360" textAnchor="middle" className="text-sm fill-muted-foreground font-semibold">
              Lower right
            </text>
            <text x="100" y="360" textAnchor="middle" className="text-sm fill-muted-foreground font-semibold">
              Lower left
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
