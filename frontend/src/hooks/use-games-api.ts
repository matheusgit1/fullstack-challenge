import { apiFetch } from "@/app/_lib/api";
import { useGameStore } from "@/stores/game-store";
import { UserBet } from "@/types/bet";
import { CurrentRound, RoundHistory } from "@/types/games";
import { useSession } from "next-auth/react";

export function useGamesApi() {
  const { data } = useSession();
  const updateCurrentRound = useGameStore((state) => state.setCurrentRound);
  const replaceRoundHistory = useGameStore(
    (state) => state.replaceRoundHistory,
  );
  const addBet = useGameStore((state) => state.addBet);
  const replaceMyBetHistory = useGameStore(
    (state) => state.replaceMyBetHistory,
  );

  const fetchCurrentRound = async () => {
    //rodada atual
    const { response: currentRound, status } = await apiFetch<CurrentRound>(
      "game",
      "/games/rounds/current",
    );
    if (!currentRound.success) throw new Error(currentRound.error.message);
    const currentRoundz = currentRound.data;
    currentRoundz.bets.forEach((bet) => addBet(bet, data?.user?.sub ?? ""));

    updateCurrentRound(currentRoundz);
    return { currentRound, status };
  };

  const fetchRoundHistory = async (page = 1, limit = 30) => {
    const { response: roundHistory, status } = await apiFetch<{
      data: RoundHistory[];
    }>("game", `/games/rounds/history?page=${page}&limit=${limit}`);
    if (!roundHistory.success) throw new Error(roundHistory.error.message);

    replaceRoundHistory(roundHistory.data.data);
    return { roundHistory, status };
  };

  const fetchMyBetHistory = async (page = 1, limit = 30) => {
    const { response: myBetHistory } = await apiFetch<{
      data: {
        bets: UserBet[];
        totalBetsAmount: number;
        totalProfit: number;
        successRate: number;
      };
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>("game", `/games/bets/me?page=${page}&limit=${limit}`);
    if (!myBetHistory.success) throw new Error(myBetHistory.error.message);
    replaceMyBetHistory(myBetHistory.data);
    return { myBetHistory };
  };

  return { fetchCurrentRound, fetchRoundHistory, fetchMyBetHistory };
}
