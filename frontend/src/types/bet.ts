import { BetStatus } from "./games";

export interface UserBet {
  roundCrashPoint: number;
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
