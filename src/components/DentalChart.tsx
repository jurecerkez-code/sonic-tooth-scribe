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
      className="cursor-pointer transition-transform hover:scale-110"
      onClick={onClick}
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      style={{ transformOrigin: '20px 30px' }}
    >
      <path
        d="M20 5 Q10 10, 10 25 Q10 45, 15 55 Q20 60, 25 55 Q30 45, 30 25 Q30 10, 20 5 Z"
        className={`${getToothColor(condition)} stroke-border stroke-2 transition-colors`}
      />
      <text
        x="20"
        y="35"
        textAnchor="middle"
        className="text-xs font-semibold fill-card-foreground pointer-events-none"
        transform={`rotate(${-rotation}, 20, 35)`}
      >
        {number}
      </text>
    </g>
  );
};

export const DentalChart = ({ teethStatus, onToothClick }: DentalChartProps) => {
  const upperTeeth = Array.from({ length: 16 }, (_, i) => i + 1);
  const lowerTeeth = Array.from({ length: 16 }, (_, i) => i + 17);

  // Calculate positions for upper arch (U-shaped curve)
  const getUpperToothPosition = (toothNum: number) => {
    const index = toothNum - 1;
    const totalTeeth = 16;
    const centerX = 400;
    const radiusX = 280;
    const radiusY = 120;
    
    // Angle from -150 to -30 degrees (upper arch)
    const angle = -150 + (index * 120 / (totalTeeth - 1));
    const angleRad = (angle * Math.PI) / 180;
    
    const x = centerX + radiusX * Math.cos(angleRad);
    const y = 150 + radiusY * Math.sin(angleRad);
    
    // Calculate rotation for tooth to point outward from center
    const rotation = angle + 90;
    
    return { x, y, rotation };
  };

  // Calculate positions for lower arch (inverted U-shaped curve)
  const getLowerToothPosition = (toothNum: number) => {
    const index = toothNum - 17;
    const totalTeeth = 16;
    const centerX = 400;
    const radiusX = 280;
    const radiusY = 120;
    
    // Angle from 150 to 30 degrees (lower arch, mirrored)
    const angle = 150 - (index * 120 / (totalTeeth - 1));
    const angleRad = (angle * Math.PI) / 180;
    
    const x = centerX + radiusX * Math.cos(angleRad);
    const y = 300 + radiusY * Math.sin(angleRad);
    
    // Calculate rotation for tooth to point outward from center
    const rotation = angle - 90;
    
    return { x, y, rotation };
  };

  return (
    <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
      <div className="space-y-8">
        {/* Upper Arch */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 text-center">
            Upper Arch (Maxillary)
          </h3>
          <svg viewBox="0 0 800 250" className="w-full" style={{ maxHeight: '250px' }}>
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
          </svg>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-dashed border-border" />

        {/* Lower Arch */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 text-center">
            Lower Arch (Mandibular)
          </h3>
          <svg viewBox="0 0 800 250" className="w-full" style={{ maxHeight: '250px' }}>
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
