import React, { useState, useRef } from 'react';

interface KnobProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  defaultValue?: number;
  color?: string;
  size?: number;
  onChange: (val: number) => void;
}

export const Knob: React.FC<KnobProps> = ({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  defaultValue,
  color = '#f97316',
  size = 54,
  onChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number>(0);
  const startValueRef = useRef<number>(value);

  // Map value to angle (-135 deg to +135 deg)
  const range = max - min;
  const pct = (value - min) / range;
  const angle = -135 + pct * 270;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = value;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = startYRef.current - e.clientY; // Drag up increases value
    const sensitivity = range / 150; // 150px drag for full range
    let newValue = startValueRef.current + deltaY * sensitivity;
    newValue = Math.max(min, Math.min(max, newValue));
    
    // Snap to step
    if (step > 0) {
      newValue = Math.round(newValue / step) * step;
    }
    onChange(newValue);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  const handleDoubleClick = () => {
    if (defaultValue !== undefined) {
      onChange(defaultValue);
    }
  };

  // SVG Arc calculation for glowing ring
  const strokeWidth = 5;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;
  const strokeDasharray = 2 * Math.PI * radius;
  // 270 degrees out of 360 = 0.75 ratio of circumference
  const arcLength = strokeDasharray * 0.75;
  const strokeDashoffset = arcLength * (1 - pct);

  return (
    <div className="flex flex-col items-center select-none group touch-none">
      <div
        className="relative cursor-ns-resize flex items-center justify-center transition-transform active:scale-95"
        style={{ width: size, height: size }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        title={`${label}: ${Math.round(value)}${unit} (Drag up/down, double click to reset)`}
      >
        {/* Background Dial SVG Arc */}
        <svg className="w-full h-full transform -rotate-225" viewBox={`0 0 ${size} ${size}`}>
          {/* Track Arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#27272a"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${strokeDasharray}`}
            strokeLinecap="round"
          />
          {/* Active Value Arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${strokeDasharray}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${color}80)`,
              transition: isDragging ? 'none' : 'stroke-dashoffset 0.15s ease-out',
            }}
          />
        </svg>

        {/* Inner Tactile Knob Body */}
        <div
          className="absolute rounded-full bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 border border-zinc-600 shadow-lg flex items-center justify-center"
          style={{
            width: size - 16,
            height: size - 16,
            transform: `rotate(${angle}deg)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          {/* Pointer Marker Dot/Line */}
          <div
            className="absolute top-1 w-1.5 h-3 rounded-full shadow-sm"
            style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
          />
        </div>
      </div>

      {/* Label and Value Display */}
      <span className="text-[10px] font-semibold tracking-wider text-zinc-400 mt-1 uppercase truncate max-w-[70px] text-center">
        {label}
      </span>
      <span className="text-[11px] font-mono font-bold text-zinc-200">
        {Math.round(value)}
        {unit}
      </span>
    </div>
  );
};
