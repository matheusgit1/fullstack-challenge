import { Round } from "@/infrastructure/database/orm/entites/round.entity";

export interface IRoundRepository {
  findByRoundId(roundId: string): Promise<Round | null>;
  findCurrentBettingRound(): Promise<Round | null>;
  findCurrentRunningRound(): Promise<Round | null>;
  findRoundWithBets(roundId: string): Promise<Round | null>;
  findRoundsHistory(page: number, limit: number): Promise<[Round[], number]>;
}

export const ROUND_REPOSITORY = Symbol("IRoundRepository");
