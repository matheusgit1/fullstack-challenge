"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/app/_lib/api";
import { Wallet } from "@/types/wallet";
import { useGameStore } from "@/stores/game-store";

interface UseWalletReturn {
  wallet: Wallet | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWalletApi(): UseWalletReturn {
  const { status } = useSession();
  const updateBalance = useGameStore((state) => state.updateBalance);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = async () => {
    if (status !== "authenticated") return;

    setIsLoading(true);
    setError(null);

    try {
      const { response } = await apiFetch<Wallet>("wallet", "/wallets/me");

      if (!response.success) {
        throw new Error(response.error.message);
      }

      setWallet(() => response.data);
      updateBalance(response.data.balance);
    } catch (err) {
      console.error("Erro ao carregar wallet:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar wallet");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [status]);

  return { wallet, isLoading, error, refetch: fetchWallet };
}
