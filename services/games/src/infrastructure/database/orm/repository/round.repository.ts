import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOneOptions } from "typeorm";
import { Round, RoundStatus } from "../entites/round.entity";
import type { IRoundRepository } from "@/domain/orm/repositories/round.repository";

@Injectable()
export class RoundRepository implements IRoundRepository {
  constructor(
    @InjectRepository(Round)
    private readonly repository: Repository<Round>,
  ) {}

  async findByRoundId(roundId: string): Promise<Round | null> {
    return this.repository.findOne({
      where: { id: roundId },
      relations: ["bets"],
    });
  }

  async findCurrentBettingRound(): Promise<Round | null> {
    return this.repository.findOne({
      where: [{ status: RoundStatus.BETTING }, { status: RoundStatus.RUNNING }],
      order: { createdAt: "DESC" },
      relations: ["bets"],
    });
  }

  async findCurrentRunningRound(): Promise<Round | null> {
    return this.repository.findOne({
      where: [{ status: RoundStatus.RUNNING }],
      order: { createdAt: "DESC" },
      relations: ["bets"],
    });
  }

  async findRoundWithBets(roundId: string): Promise<Round | null> {
    return this.repository.findOne({
      where: { id: roundId },
      relations: ["bets"],
    });
  }

  async findRoundsHistory(
    page: number = 1,
    limit: number = 20,
  ): Promise<[Round[], number]> {
    const skip = (page - 1) * limit;

    return this.repository.findAndCount({
      // where: { status: RoundStatus.CRASHED },
      order: { crashedAt: "DESC" },
      skip,
      take: limit,
    });
  }

  async saveRound(round: Round): Promise<Round> {
    return this.repository.save(round);
  }

  async createRound(data: Partial<Round>): Promise<Round> {
    const round = this.repository.create(data);
    return this.repository.save(round);
  }
}
