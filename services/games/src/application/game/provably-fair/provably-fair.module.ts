import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProvablyFairService } from './provably-fair.service';
import { PROVABY_SERVICE } from '@/domain/core/provably-fair/provably-fair.service';
import { Bet } from '@/infrastructure/database/orm/entites/bet.entity';
import { ProvablyFairSeed } from '@/infrastructure/database/orm/entites/provably-fair.entity';
import { Round } from '@/infrastructure/database/orm/entites/round.entity';
import { BetRepository } from '@/infrastructure/database/orm/repository/bet.repository';
import { RoundRepository } from '@/infrastructure/database/orm/repository/round.repository';
import { ROUND_REPOSITORY } from '@/domain/orm/repositories/round.repository';
import { ProvablyFairUtil } from './provably-fair.util';

@Module({
  imports: [TypeOrmModule.forFeature([ProvablyFairSeed, Round, Bet])],
  providers: [
    ProvablyFairUtil,
    {
      provide: PROVABY_SERVICE,
      useClass: ProvablyFairService,
    },
    {
      provide: ROUND_REPOSITORY,
      useClass: RoundRepository,
    },
  ],
  exports: [TypeOrmModule, ProvablyFairUtil, PROVABY_SERVICE],
})
export class ProvablyFairModule {}
