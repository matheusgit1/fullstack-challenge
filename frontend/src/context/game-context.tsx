"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/app/lib/api";
import { useGameStore } from "@/stores/game-store";
import { Wallet } from "@/types/wallet";

interface GameContextProps {
  wallet: Wallet | null;
  isInitializing: boolean;
}

const GameContext = createContext({} as GameContextProps);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const setUser = useGameStore((state) => state.setUser);
  const updateBalance = useGameStore((state) => state.updateBalance);

  const [wallet, setWalletState] = useState<Wallet | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    setUser({
      id: session.user.id ?? session.user.email ?? "unknown",
      username:
        session.user.name ?? session.user.email?.split("@")[0] ?? "Player",
      balance: 0,
    });
  }, [status, session?.user?.id]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const initialize = async () => {
      try {
        const { response } = await apiFetch<Wallet>("wallet", "/wallets/me");

        if (!response.success) throw new Error(response.error.message);

        setWalletState(response.data);
        updateBalance(response.data.balance);
      } catch (err) {
        console.error("Erro ao carregar wallet:", err);
      } finally {
        setIsInitializing(false);
      }
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
