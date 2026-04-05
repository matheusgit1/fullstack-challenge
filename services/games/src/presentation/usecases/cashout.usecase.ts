import { ConflictException, GoneException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { type Request } from 'express';
import { CashoutRequestDto } from '../dtos/request/cashout-request.dto';
import { HandlerUsecase } from '../interfaces/usecase.interface';
import { GamesManager } from '../manager/games.manager';
import { BET_REPOSITORY, type IBetRepository } from '@/domain/orm/repositories/bet.repository';
import { type IWalletProxy, WALLET_PROXY } from '@/domain/proxy/wallet.proxy';
import { BetStatus } from '@/infrastructure/database/orm/entites/bet.entity';

@Injectable()
export class CashOutUsecase implements HandlerUsecase {
  constructor(
    @Inject(BET_REPOSITORY) private readonly betRepository: IBetRepository,
    @Inject(WALLET_PROXY) private readonly proxyService: IWalletProxy,
    @Inject(REQUEST) private readonly request: Request,
    private readonly gamesManager: GamesManager,
  ) {}

  async handler(dto: CashoutRequestDto) {
    const { user, hash, token } = this.request;
    const bet = await this.betRepository.findByFilters({
      where: { id: dto.betId, userId: user?.sub || 'anonymous' },
      relations: ['round'],
    });

    if (!bet || !bet.round) {
      throw new ConflictException('Nenhuma rodada ou aposta encontrada');
    }
    this.getErrorByStatus(bet.status);
    const { round } = bet;

    const externalId = bet.id;

    if (round.isCrashed()) {
      const cashout = await this.gamesManager.processCashout(bet, round, user?.sub || 'anonymous', externalId, hash);
      return cashout;
    }

    if (round.isRunning()) {
      const cashin = await this.gamesManager.processCashin(bet, round, user?.sub || 'anonymous', externalId, hash);

      return cashin;
    }

    throw new Error('Rodada já finalizada, saque indisponível');
  }

  private getErrorByStatus(status: BetStatus) {
    const dictionary = {
      [BetStatus.PENDING]: () => {
        //não faz nada só continua o fluxo
      },
      [BetStatus.LOST]: () => {
        throw new GoneException('Aposta perdida');
      },
      [BetStatus.CASHED_OUT]: () => {
        throw new NotFoundException('Aposta sacada');
      },
    };

    return dictionary[status]();
  }
}
