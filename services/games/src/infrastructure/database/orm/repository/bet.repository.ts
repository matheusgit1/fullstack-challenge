import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindOneOptions, FindManyOptions } from 'typeorm';
import { Bet, BetStatus } from '../entites/bet.entity';
import { type IBetRepository } from '@/domain/orm/repositories/bet.repository';

@Injectable()
export class BetRepository implements IBetRepository {
  constructor(
    @InjectRepository(Bet)
    private readonly repository: Repository<Bet>,
  ) {}

  async findBetsByFilters(options: FindManyOptions<Bet>): Promise<Bet[]> {
    return await this.repository.find(options);
  }

  async setPendingBetsToLost(roundId: string): Promise<void> {
    await this.repository.update({ roundId, status: BetStatus.PENDING }, { status: BetStatus.LOST });
  }

  async save(bet: Bet): Promise<Bet> {
    return await this.repository.save(bet);
  }

  async findBetByFilters(options: FindOneOptions<Bet>): Promise<Bet | null> {
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
  ): Promise<{
    results: [Bet[], number];
    totalBetsAmount: number;
    totalProfit: number;
    successRate: number;
  }> {
    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<Bet> = { userId };

    if (status) {
      where.status = status;
    }

    const bets = await this.repository.find({ where });
    const totalBetsAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
    const totalProfit = bets.reduce((sum, bet) => sum + this.calculateProfit(bet) || 0, 0);
    const successRate = (bets.filter((b) => b.status === BetStatus.CASHED_OUT).length / bets.length) * 100 || 0;

    const results = await this.repository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
      relations: ['round'],
    });

    return {
      results: results,
      totalBetsAmount,
      totalProfit,
      successRate,
    };
  }

  private calculateProfit(bet: Bet) {
    const actions: Record<BetStatus, number> = {
      cashed_out: bet.amount * bet.multiplier - bet.amount,
      lost: -bet.amount,
      pending: 0,
    };
    return actions[bet.status];
  }
}
