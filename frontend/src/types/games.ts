export type RoundStatus = "betting" | "running" | "crashed";

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
}

export interface GameState {
  currentRound: CurrentRound | null;
  myBet: Bet | null;
  currentBets: Bet[];
  roundHistory: RoundHistory[];
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface RoundHistory {
  roundId: string;
  crashPoint: "secret" | number;
  serverSeedHash: string;
  endedAt: string;
  status: RoundStatus;
  multiplier: number;
  bettingStartedAt: string;
  bettingEndsAt: string;
  roundStartedAt: string;
  roundCrashedAt: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  createdAt: string;
  updatedAt: string;
  bets: Bet[];
}
