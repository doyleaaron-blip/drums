import React, { useRef, useEffect } from 'react';
import { synthEngine } from '../../audio/synthEngine';

interface OscilloscopeProps {
  kitColor?: string;
  isPlaying?: boolean;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  kitColor = '#f97316',
  isPlaying = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;

      // Dark CRT cathode background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);

      // CRT Grid overlay
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1;
      const gridX = width / 8;
      const gridY = height / 4;

      for (let x = gridX; x < width; x += gridX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = gridY; y < height; y += gridY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const analyser = synthEngine.analyserNode;
      if (!analyser || !isPlaying) {
        // Flat horizontal line with slight analog noise bloom
        ctx.beginPath();
        ctx.strokeStyle = kitColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = kitColor;
        ctx.shadowBlur = 8;
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      // Draw Waveform Line
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = kitColor;
      ctx.shadowColor = kitColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();

      const sliceWidth = (width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    draw();

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [kitColor, isPlaying]);

  return (
    <div className="relative rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner p-1">
      <canvas
        ref={canvasRef}
        width={320}
        height={64}
        className="w-full h-[64px] block rounded"
      />
      {/* Analog CRT Scanlines effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
    </div>
  );
};
