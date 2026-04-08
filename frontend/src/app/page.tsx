"use client";

import { CrashChart } from "@/components/game/crash-chart";
import { BetControls } from "@/components/game/bet-controll";
import { RoundTimer } from "@/components/game/round-timer";
import { CurrentBets } from "@/components/game/current-bets";
import { RoundHistory } from "@/components/game/round-history";
import { useGameStore } from "@/stores/game-store";
import { useWebSocket } from "@/hooks/use-websocket";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { SessionProvider } from "next-auth/react";
import { AuthGuard } from "@/guards/auth-guard";

export default function GamePage() {
  const { currentRound } = useGameStore();

  useWebSocket();

  return (
    <SessionProvider>
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
                <div className="p-4">
                  <RoundTimer />
                </div>
                <div className="p-4 pt-0">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">
                      {currentRound?.status === "betting" && "🎲 APOSTE AGORA"}
                      {currentRound?.status === "running" &&
                        "📈 MULTIPLICADOR SUBINDO"}
                      {currentRound?.status === "crashed" &&
                        "💥 RODADA ENCERRADA"}
                    </h2>
                    {currentRound?.serverSeedHash && (
                      <span className="text-xs text-slate-500 font-mono">
                        Seed: {currentRound.serverSeedHash.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                  <CrashChart />
                </div>
              </Card>

              <CurrentBets />
            </div>

            <div className="space-y-6">
              <BetControls />
              <RoundHistory />
            </div>
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
