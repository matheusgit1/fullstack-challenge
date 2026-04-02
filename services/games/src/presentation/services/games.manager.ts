import { ProvablyFairService } from "@/application/services/provably-fair/provably-fair.service";
import { Bet } from "@/infrastructure/database/orm/entites/bet.entity";
import { BetRepository } from "@/infrastructure/database/orm/repository/bet.repository";
import { RoundRepository } from "@/infrastructure/database/orm/repository/round.repository";
import { ProxyService } from "@/infrastructure/proxy/proxy.service";
import { RabbitmqProducerService } from "@/infrastructure/rabbitmq/rabbitmq.producer";
import { TransactionSource } from "@/infrastructure/rabbitmq/rabbitmq.types";
import { Injectable } from "@nestjs/common";
import { CashoutResponseDto } from "../dtos/request/cashout-request.dto";
import { Round } from "@/infrastructure/database/orm/entites/round.entity";

@Injectable()
export class GamesManager {
  constructor(
    private readonly roundRepository: RoundRepository,
    private readonly provablyFairService: ProvablyFairService,
    private readonly betRepository: BetRepository,
    private readonly proxyService: ProxyService,
    private readonly rabbitmqProducer: RabbitmqProducerService,
  ) {}

  public async processCashout(
    bet: Bet,
    round: Round,
    userId: string,
    externalId: string,
    tracingId: string,
  ) {
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

  public async processCashin(
    bet: Bet,
    round: Round,
    userId: string,
    externalId: string,
    tracingId: string,
  ) {
    await this.rabbitmqProducer.publishCashin({
      cashType: TransactionSource.BET_PLACED,
      userId: userId,
      multiplier: round.multiplier,
      timestamp: new Date().toISOString(),
      externalId: externalId,
      tracingId
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
