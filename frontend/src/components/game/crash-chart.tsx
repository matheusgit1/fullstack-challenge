// frontend/src/components/game/CrashChart.tsx

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/game-store';

interface CrashChartProps {
  width?: number;
  height?: number;
}

export function CrashChart({ width = 800, height = 400 }: CrashChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentRound } = useGameStore();
  const animationRef = useRef<number>();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const multiplier = currentRound?.multiplier || 1.0;
    const crashed = currentRound?.status === 'crashed';
    const crashPoint = currentRound?.crashPoint || null;
    
    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
      
      // Grid
      ctx.beginPath();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      
      // Linhas verticais (tempo)
      for (let x = 0; x <= width; x += width / 10) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      // Linhas horizontais (multiplicador)
      for (let y = 0; y <= height; y += height / 10) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Curva do crash
      ctx.beginPath();
      ctx.strokeStyle = crashed ? '#ef4444' : '#22c55e';
      ctx.lineWidth = 3;
      
      const maxMultiplier = Math.max(multiplier, crashPoint || 1.0, 10);
      const maxY = height - 40;
      
      for (let x = 0; x <= width; x++) {
        const t = x / width; // 0 a 1
        // Função exponencial simulando crescimento
        const curveMultiplier = Math.pow(1 + t * 3, 2);
        const y = maxY - (curveMultiplier / maxMultiplier) * maxY;
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        // Marcar ponto do crash
        if (crashPoint && curveMultiplier >= crashPoint && !crashed) {
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y);
        }
      }
      ctx.stroke();
      
      // Ponto atual
      const currentX = width;
      const currentT = 1;
      const currentCurveMultiplier = Math.pow(1 + currentT * 3, 2);
      const currentY = maxY - (currentCurveMultiplier / maxMultiplier) * maxY;
      
      ctx.beginPath();
      ctx.fillStyle = crashed ? '#ef4444' : '#22c55e';
      ctx.arc(currentX, currentY, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // Texto do multiplicador atual
      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = '#f1f5f9';
      ctx.shadowBlur = 0;
      ctx.fillText(`${multiplier.toFixed(2)}x`, width - 100, 50);
      
      if (crashed && crashPoint) {
        ctx.font = 'bold 18px monospace';
        ctx.fillStyle = '#ef4444';
        ctx.fillText(`Crash at ${crashPoint.toFixed(2)}x`, width - 150, 100);
      }
    };
    
    draw();
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [currentRound, width, height]);
  
  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg border border-slate-700"
      />
    </div>
  );
}