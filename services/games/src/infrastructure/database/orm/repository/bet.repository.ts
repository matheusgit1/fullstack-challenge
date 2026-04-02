
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, FindOneOptions } from "typeorm";
import { Bet, BetStatus } from "../entites/bet.entity";
import { type IBetRepository } from "@/domain/orm/repositories/bet.repository";




@Injectable()
export class BetRepository implements IBetRepository {
  constructor(
    @InjectRepository(Bet)
    private readonly repository: Repository<Bet>,
  ) {}

  async setPendingBetsToLost(roundId: string): Promise<void> {
    await this.repository.update(
      { roundId, status: BetStatus.PENDING },
      { status: BetStatus.LOST },
    );
  }

  async save(bet: Bet): Promise<Bet> {
    return await this.repository.save(bet);
  }

  async findByFilters(options: FindOneOptions<Bet>): Promise<Bet | null> {
    return this.repository.findOne(options);
  }

  async findPeddingBets(): Promise<Bet[]> {
    return this.repository.find({
      where: { status: BetStatus.PENDING },
    });
  }

  async findLooserBetsByRoundId(roundId: string): Promise<Bet[]> {
    return this.repository.find({
      where: { status: BetStatus.LOST, roundId },
    });
  }

  async createBet(data: Partial<Bet>): Promise<Bet> {
    const bet = this.repository.create(data);
    return this.repository.save(bet);
  }

  async findUserBetsHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
    status?: BetStatus,
  ): Promise<[Bet[], number]> {
    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<Bet> = { userId };

    if (status) {
      where.status = status;
    }

    return this.repository.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip,
      take: limit,
      relations: ["round"],
    });
  }
}
