import { Round } from "@/infrastructure/database/orm/entites/round.entity";

export interface IRoundRepository {
  findByRoundId(roundId: string): Promise<Round | null>;
  findCurrentBettingRound(): Promise<Round | null>;
  findCurrentRunningRound(): Promise<Round | null>;
  findRoundWithBets(roundId: string): Promise<Round | null>;
  findRoundsHistory(page: number, limit: number): Promise<[Round[], number]>;
  saveRound(round: Round): Promise<Round>;
  createRound(data: Partial<Round>): Promise<Round>
}

export const ROUND_REPOSITORY = Symbol("IRoundRepository");
