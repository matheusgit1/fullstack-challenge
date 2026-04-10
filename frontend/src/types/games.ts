import { ApiPagination } from "./api";
import { UserBet } from "./bet";
import { RoundHistory, RoundStatus } from "./round";

export type BetStatus = "pending" | "cashed_out" | "lost";

export interface Round {
  id: string;
  status: RoundStatus;
  multiplier: number;
  crashPoint: number | null;
  bettingEndsAt: Date | null;
  startedAt: Date | null;
  crashedAt: Date | null;
  serverSeedHash: string;
}

export interface Bet {
  id: string;
  roundId: string;
  userId: string;
  amount: number;
  multiplier: number | null;
  status: BetStatus;
  cashedOutAt: string | null;
  createdAt: string;
}

export interface CurrentRound {
  id: string;
  status: RoundStatus;
  multiplier: number;
  bets: Bet[];
  serverSeedHash: string;
  bettingStartedAt: string;
  bettingEndsAt: string;
  startedAt: string;
  crashPoint: number | "secret";
}

export interface User {
  id: string;
  username: string;
  balance: number;
  acessToken?: string;
}

export interface GameState {
  currentRound: CurrentRound | null;
  myBet: Bet | null;
  currentBets: Bet[];
  roundHistory: ApiPagination<RoundHistory[]>;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  myBetHistory: {
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
  };
}
