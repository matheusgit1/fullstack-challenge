import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { type Request } from 'express';
import { BetRequestDto, BetResponseDto } from '../dtos/request/bet-request.dto';
import { HandlerUsecase } from '../interfaces/usecase.interface';
import { BET_REPOSITORY, type IBetRepository } from '@/domain/orm/repositories/bet.repository';
import { type IRoundRepository, ROUND_REPOSITORY } from '@/domain/orm/repositories/round.repository';
import { type IWalletProxy, WALLET_PROXY } from '@/domain/proxy/wallet.proxy';
import { BetStatus } from '@/infrastructure/database/orm/entites/bet.entity';
import { GamesManager } from '../manager/games.manager';
import { EventService } from '@/application/events/event/event.service';

@Injectable()
export class BetUseCase implements HandlerUsecase {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    @Inject(BET_REPOSITORY) private readonly betRepository: IBetRepository,
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: IRoundRepository,
    @Inject(WALLET_PROXY) private readonly proxyService: IWalletProxy,
    private readonly gamesManager: GamesManager,
    private readonly eventService: EventService,
  ) {}

  async handler(dto: BetRequestDto): Promise<BetResponseDto> {
    try {
      const { user, hash, token } = this.request;

      const userBalance = await this.proxyService.getUserBalance(token!);
      const isAvailableBet = userBalance.data.balanceInCents >= dto.amount;

      if (!isAvailableBet) {
        throw new ConflictException('Saldo insuficiente');
      }
      const round = await this.roundRepository.findByRoundId(dto.roundId);

      if (!round) {
        throw new NotFoundException('Nenhuma rodada ativa');
      }
      if (!round.isBettingPhase()) {
        throw new ConflictException('Fase de aposta encerrada');
      }

      const bet = await this.betRepository.createBet({
        userId: user?.sub || 'Anonymous',
        roundId: dto.roundId,
        amount: dto.amount,
        status: BetStatus.PENDING,
      });

      await this.gamesManager.processBet(bet, user?.sub || 'Anonymous', dto.amount, hash);

      //emit evento de aposta
      await this.eventService.emitBet

      return new BetResponseDto({
        bet: {
          id: bet.id,
          userId: user?.sub || 'Anonymous',
          amount: dto.amount,
          multiplier: 1,
          status: BetStatus.PENDING,
          cashedOutAt: null,
          createdAt: new Date(),
        },
        newBalance: userBalance.data.balanceInCents - dto.amount,
        roundId: round.id,
      });
    } catch (err) {
      throw err;
    }
  }
}
