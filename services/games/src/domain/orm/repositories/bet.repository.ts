import { type FindOneOptions } from "typeorm";
import {
  Bet,
  type BetStatus,
} from "@/infrastructure/database/orm/entites/bet.entity";

export interface IBetRepository {
  setPendingBetsToLost(roundId: string): Promise<void>;
  save(bet: Bet): Promise<Bet>;
  findByFilters(options: FindOneOptions<Bet>): Promise<Bet | null>;
  findPeddingBets(): Promise<Bet[]>;
  findLooserBetsByRoundId(roundId: string): Promise<Bet[]>;
  createBet(data: Partial<Bet>): Promise<Bet>;
  findUserBetsHistory(
    userId: string,
    page: number,
    limit: number,
    status?: BetStatus,
  ): Promise<[Bet[], number]>;
}

export const BET_REPOSITORY = Symbol("IBetRepository");
