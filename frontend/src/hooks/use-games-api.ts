import { apiFetch } from "@/app/_lib/api";
import { useGameStore } from "@/stores/game-store";
import { ApiPagination } from "@/types/api";
import { BetHistory, UserBet } from "@/types/bet";
import { CurrentRound } from "@/types/games";
import { RoundHistory } from "@/types/round";
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
    currentRoundz.bets.forEach((bet) => addBet(bet));

    updateCurrentRound(currentRoundz);
    return { currentRound, status };
  };

  const fetchRoundHistory = async (page = 1, limit = 30) => {
    const { response: roundHistory, status } = await apiFetch<
      ApiPagination<RoundHistory[]>
    >("game", `/games/rounds/history?page=${page}&limit=${limit}`);
    if (!roundHistory.success) throw new Error(roundHistory.error.message);

    replaceRoundHistory(roundHistory.data);
    return { roundHistory, status };
  };

  const fetchMyBetHistory = async (page = 1, limit = 30) => {
    const { response: myBetHistory } = await apiFetch<
      ApiPagination<BetHistory>
    >("game", `/games/bets/me?page=${page}&limit=${limit}`);
    if (!myBetHistory.success) throw new Error(myBetHistory.error.message);
    replaceMyBetHistory(myBetHistory.data);
    return { myBetHistory };
  };

  return { fetchCurrentRound, fetchRoundHistory, fetchMyBetHistory };
}
