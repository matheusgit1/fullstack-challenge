export type RoundStatus = "betting" | "running" | "crashed";

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
  userId: string;
  username: string;
  amount: number;
  multiplier: number | null;
  status: "pending" | "cashed_out" | "lost";
  cashedOutAt: Date | null;
}

export interface User {
  id: string;
  username: string;
  balance: number;
}

export interface GameState {
  currentRound: Round | null;
  myBet: Bet | null;
  currentBets: Bet[];
  roundHistory: RoundHistory[];
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface RoundHistory {
  roundId: string;
  crashPoint: number;
  serverSeedHash: string;
  verified: boolean;
}
