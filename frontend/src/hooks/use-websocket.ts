// frontend/src/hooks/useWebSocket.ts

import { useEffect, useRef } from "react";
import { useGameStore } from "@/stores/game-store";
import { Round, Bet } from "@/types/games";

// Dados mockados para simular eventos
const mockRound: Round = {
  id: "round_1",
  status: "betting",
  multiplier: 1.0,
  crashPoint: null,
  bettingEndsAt: new Date(Date.now() + 10000),
  startedAt: null,
  crashedAt: null,
  serverSeedHash: "mock_seed_hash_123456",
};

export function useWebSocket() {
  const { setCurrentRound, updateMultiplier, addBet, updateBet, clearBets } =
    useGameStore();

  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const roundIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Simular conexão WebSocket
    console.log("🔌 WebSocket conectado (mock)");

    // Simular início da rodada
    setTimeout(() => {
      startMockRound();
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (roundIntervalRef.current) clearInterval(roundIntervalRef.current);
      console.log("🔌 WebSocket desconectado");
    };
  }, []);

  const startMockRound = () => {
    // Reset bets
    clearBets();

    // Fase de apostas
    setCurrentRound({ ...mockRound, status: "betting", multiplier: 1.0 });

    // Timer para terminar apostas
    setTimeout(() => {
      startRunningRound();
    }, 10000);
  };

  const startRunningRound = () => {
    // Iniciar rodada
    const { currentRound } = useGameStore.getState();
    if (currentRound) {
      setCurrentRound({
        ...currentRound,
        status: "running",
        startedAt: new Date(),
      });
    }


    let multiplier = 1.0;
    const crashPoint = Math.random() * 10 + 1; // Entre 1x e 11x

    intervalRef.current = setInterval(() => {
      multiplier += 0.05;
      updateMultiplier(multiplier);

      if (multiplier >= crashPoint) {
        clearInterval(intervalRef.current);
        crashRound(crashPoint);
      }
    }, 100);
  };

  const crashRound = (crashPoint: number) => {
    const { currentRound } = useGameStore.getState();
    if (currentRound) {
      setCurrentRound({
        ...currentRound,
        status: "crashed",
        crashPoint,
        crashedAt: new Date(),
      });
    }

    // Apostas pendentes viram perdas
    const { currentBets, updateBet } = useGameStore.getState();
    currentBets.forEach((bet) => {
      if (bet.status === "pending") {
        updateBet(bet.id, { status: "lost", multiplier: crashPoint });
      }
    });

    // Próxima rodada após 3 segundos
    setTimeout(() => {
      startMockRound();
    }, 3000);
  };


  const addMockBet = (username: string, amount: number) => {
    const mockBet: Bet = {
      id: Math.random().toString(36).substr(2, 9),
      userId: Math.random().toString(),
      username,
      amount,
      multiplier: null,
      status: "pending",
      cashedOutAt: null,
    };
    addBet(mockBet);
  };


  useEffect(() => {
    const interval = setInterval(() => {
      const { currentRound } = useGameStore.getState();
      if (currentRound?.status === "betting") {
        const randomAmount = Math.floor(Math.random() * 500) + 10;
        const mockUsernames = [
          "LuckyPlayer",
          "HighRoller",
          "RiskTaker",
          "Gambler99",
        ];
        const randomUser =
          mockUsernames[Math.floor(Math.random() * mockUsernames.length)];
        addMockBet(randomUser, randomAmount);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return { isConnected: true };
}
