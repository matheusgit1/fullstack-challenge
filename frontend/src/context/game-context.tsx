"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useGameStore } from "@/stores/game-store";
import { Wallet } from "@/types/wallet";
import { useGamesApi } from "@/hooks/use-games-api";
import { useWalletApi } from "@/hooks/use-wallet-api";

interface GameContextProps {
  wallet: Wallet | null;
  isInitializing: boolean;
}

const GameContext = createContext({} as GameContextProps);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { fetchCurrentRound, fetchRoundHistory } = useGamesApi();
  const { wallet } = useWalletApi();
  const setUser = useGameStore((state) => state.setUser);

  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    setUser({
      id:
        session.user.id ?? session.user.sub ?? session.user.email ?? "unknown",
      username:
        session.user.name ?? session.user.email?.split("@")[0] ?? "Player",
      balance: 0,
      acessToken: session.accessToken,
    });
  }, [status, session?.user?.id]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const initialize = async () => {
      await fetchCurrentRound();
      await fetchRoundHistory();
    };

    initialize();
  }, [status]);

  return (
    <GameContext.Provider value={{ wallet, isInitializing }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGameContext = () => useContext(GameContext);
