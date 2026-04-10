import { Bet } from "./bet";

export type RoundStatus = "betting" | "running" | "crashed";

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
