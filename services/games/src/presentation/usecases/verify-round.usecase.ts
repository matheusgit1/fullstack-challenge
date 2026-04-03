import { Inject, Injectable } from '@nestjs/common';
import { RoundVerifyResponseDto } from '../dtos/response/round-verify-response.dto';
import { HandlerUsecase } from '../interfaces/usecase.interface';import {
  type IProvablyFairService,
  PROVABY_SERVICE,
} from '@/domain/core/provably-fair/provably-fair.service';

@Injectable()
export class VerifyRoundUsecase implements HandlerUsecase {
  constructor(
    @Inject(PROVABY_SERVICE)
    private readonly provablyFairService: IProvablyFairService,
  ) {}

  async handler(roundId: string): Promise<any> {
    const fair = await this.provablyFairService.getProvablyFairDataForRound(roundId);

    if (!fair) throw new Error("Round não encontrado ou 'provably fair' corrompido");

    return new RoundVerifyResponseDto({
      fairId: fair.id,
      serverSeed: fair.serverSeed,
      clientSeed: fair.clientSeed,
      nonce: fair.nonce,
      serverSeedHash: fair.serverSeedHash,
    });
  }
}
