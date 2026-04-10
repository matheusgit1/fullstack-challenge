import { BetStatus } from "./games";

export interface BetHistory {
  bets: UserBet[];
  totalBetsAmount: number;
  totalProfit: number;
  successRate: number;
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
  roundCrashPoint: "secret" | number;
}

export interface UserBet {
  roundCrashPoint: "secret" | number;
  roundId: string;
  id: string;
  userId: string;
  amount: number;
  multiplier: number;
  status: string;
  cashedOutAt: string | null;
  createdAt: string;
}

export interface BetsApiResponse {
  success: boolean;
  data: {
    data: UserBet[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  tracingId: string;
  timestamp: string;
}
