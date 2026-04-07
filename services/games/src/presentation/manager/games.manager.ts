import { Inject, Injectable } from '@nestjs/common';
import { CashoutResponseDto } from '../dtos/request/cashout-request.dto';
import { BET_REPOSITORY, type IBetRepository } from '@/domain/orm/repositories/bet.repository';
import {
  type IRabbitmqProducerService,
  RABBITMQ_PRODUCER_SERVICE,
  TransactionSource,
} from '@/domain/rabbitmq/rabbitmq.producer';
import { Bet } from '@/infrastructure/database/orm/entites/bet.entity';
import { Round } from '@/infrastructure/database/orm/entites/round.entity';

@Injectable()
export class GamesManager {
  constructor(
    @Inject(BET_REPOSITORY) private readonly betRepository: IBetRepository,
    @Inject(RABBITMQ_PRODUCER_SERVICE)
    private readonly rabbitmqProducer: IRabbitmqProducerService,
  ) {}

  public async processBet(bet: Bet, userId: string, amount: number, tracingId: string) {
    await this.rabbitmqProducer.publishReserve({
      cashType: TransactionSource.BET_RESERVE,
      userId: userId,
      amount: amount,
      timestamp: new Date().toISOString(),
      externalId: bet.id,
      tracingId: tracingId,
    });
  }

  public async processBetLost(bet: Bet, round: Round, userId: string, externalId: string, tracingId: string) {
    await this.rabbitmqProducer.publishCashout({
      cashType: TransactionSource.BET_LOST,
      userId: userId,
      timestamp: new Date().toISOString(),
      externalId: externalId,
      tracingId: tracingId,
    });

    bet.lose();
    await this.betRepository.save(bet);

    return new CashoutResponseDto({
      bet: {
        id: bet.id,
        userId: userId,
        amount: bet.amount,
        multiplier: round.multiplier,
        status: bet.status,
        cashedOutAt: new Date(),
        createdAt: bet.createdAt,
      },
      multiplier: round.multiplier,
      winAmount: bet.amount,
      roundStatus: round.status,
    });
  }

  public async processBetWin(bet: Bet, round: Round, userId: string, externalId: string, tracingId: string) {
    await this.rabbitmqProducer.publishCashin({
      cashType: TransactionSource.BET_PLACED,
      userId: userId,
      multiplier: round.multiplier,
      timestamp: new Date().toISOString(),
      externalId: externalId,
      tracingId: tracingId,
    });

    bet.cashout(round.multiplier);

    await this.betRepository.save(bet);

    return new CashoutResponseDto({
      bet: {
        id: bet.id,
        userId: userId,
        amount: bet.amount,
        multiplier: round.multiplier,
        status: bet.status,
        cashedOutAt: new Date(),
        createdAt: bet.createdAt,
      },
      multiplier: round.multiplier,
      winAmount: bet.amount * round.multiplier - bet.amount,
      roundStatus: round.status,
    });
  }
}
