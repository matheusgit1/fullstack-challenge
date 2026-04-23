import { useEffect, useState } from "react";
import { useGameStore } from "@/stores/game-store";
import { Progress } from "@/components/ui/progress";

export function RoundTimer() {
  const { currentRound } = useGameStore();
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!currentRound?.bettingEndsAt) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const start = new Date(currentRound.bettingStartedAt).getTime();
      const now = new Date().getTime();
      const end = new Date(currentRound.bettingEndsAt!).getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(remaining);

      const bettingDuration = end - start;
      const elapsed = bettingDuration - remaining * 1000;
      const prog = Math.min(
        100,
        Math.max(0, (elapsed / bettingDuration) * 100),
      );
      setProgress(prog);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [currentRound?.bettingEndsAt]);

  if (!currentRound) return null;

  if (currentRound.status === "betting") {
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-yellow-500 font-bold">⏱️ FASE DE APOSTAS</span>
          <span className="font-mono text-lg">{timeLeft}s</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    );
  }

  if (currentRound.status === "running") {
    return (
      <div className="text-center">
        <span className="text-green-500 font-bold animate-pulse">
          🚀 RODADA ATIVA
        </span>
      </div>
    );
  }

  if (currentRound.status === "crashed" && currentRound) {
    return (
      <div className="text-center">
        <span className="text-red-500 font-bold">
          {/* 💥 CRASHOU EM {currentRound.crashPoint}
           */}
          💥 CRASHOU
        </span>
      </div>
    );
  }

  return null;
}
