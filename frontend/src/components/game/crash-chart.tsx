import { useEffect, useRef } from "react";
import { useGameStore } from "@/stores/game-store";

interface CrashChartProps {
  width?: number;
  height?: number;
}

export function CrashChart({ width = 800, height = 400 }: CrashChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentRound } = useGameStore();

  const historyRef = useRef<number[]>([]);
  const prevRoundIdRef = useRef<string | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentRound) return;

    if (currentRound.id !== prevRoundIdRef.current) {
      historyRef.current = [];
      prevRoundIdRef.current = currentRound.id;
    }

    if (currentRound.status === "running" && currentRound.multiplier) {
      historyRef.current = [...historyRef.current, currentRound.multiplier];
    }

    if (
      currentRound.status === "crashed" &&
      prevStatusRef.current === "running" &&
      currentRound.multiplier
    ) {
      historyRef.current = [...historyRef.current, currentRound.multiplier];
    }

    prevStatusRef.current = currentRound.status;

    if (currentRound?.status === "running") {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);

      const animate = () => {
        draw();
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      draw();
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [currentRound?.multiplier, currentRound?.status, currentRound?.id]);

  const draw = (timestamp = Date.now()) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const history = historyRef.current;
    const crashed = currentRound?.status === "crashed";
    const status = currentRound?.status;
    const multiplier = currentRound?.multiplier ?? 1.0;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += width / 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += height / 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const maxMult = Math.max(...history, multiplier, 2);
    ctx.fillStyle = "#475569";
    ctx.font = "11px monospace";
    for (let i = 0; i <= 5; i++) {
      const val = ((maxMult - 1) * (i / 5) + 1).toFixed(1);
      const y = height - 20 - (i / 5) * (height - 40);
      ctx.fillText(`${val}x`, 6, y + 4);
    }

    if (history.length === 0) {
      ctx.font = "bold 18px monospace";
      ctx.fillStyle = "#475569";
      ctx.textAlign = "center";

      if (status === "betting") {
        ctx.fillText("Aguardando início da rodada...", width / 2, height / 2);
      } else {
        ctx.fillText("Conectando...", width / 2, height / 2);
      }
      ctx.textAlign = "left";
      return;
    }

    const padding = { left: 40, right: 20, top: 20, bottom: 30 };
    const drawW = width - padding.left - padding.right;
    const drawH = height - padding.top - padding.bottom;

    const color = crashed ? "#ef4444" : "#22c55e";

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    history.forEach((mult, i) => {
      const x = padding.left + (i / Math.max(history.length - 1, 1)) * drawW;
      const normalized = (mult - 1) / Math.max(maxMult - 1, 0.1);
      const y = padding.top + drawH - normalized * drawH;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.lineTo(padding.left + drawW, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = crashed ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)";
    ctx.fill();

    const lastX = padding.left + drawW;
    const lastNorm = (multiplier - 1) / Math.max(maxMult - 1, 0.1);
    const lastY = padding.top + drawH - lastNorm * drawH;

    ctx.beginPath();
    ctx.arc(lastX, lastY, crashed ? 6 : 8, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    if (!crashed) {
      const now = Date.now();
      const pulse = (Math.sin(now / 300) + 1) / 2;

      ctx.beginPath();
      ctx.arc(lastX, lastY, 14 + pulse * 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(34,197,94,${0.15 + pulse * 0.25})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(lastX, lastY, 14, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(34,197,94,${0.4 - pulse * 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.font = "bold 42px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = crashed ? "#ef4444" : "#22c55e";
    ctx.fillText(`${multiplier.toFixed(2)}x`, width / 2, height / 2);

    if (crashed) {
      ctx.font = "14px monospace";
      ctx.fillStyle = "#ef4444";
      ctx.fillText("CRASHED", width / 2, height / 2 + 30);
    }

    if (status === "betting") {
      ctx.font = "bold 18px monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("Fase de apostas", width / 2, height / 2);
    }

    ctx.textAlign = "left";
  };

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
