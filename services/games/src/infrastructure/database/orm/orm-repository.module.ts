import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bet } from './entites/bet.entity';
import { ProvablyFairSeed } from './entites/provably-fair.entity';
import { Round } from './entites/round.entity';
import { BetRepository } from './repository/bet.repository';
import { BET_REPOSITORY } from '@/domain/orm/repositories/bet.repository';
import { RoundRepository } from './repository/round.repository';
import { ROUND_REPOSITORY } from '@/domain/orm/repositories/round.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Bet, ProvablyFairSeed, Round])],
  providers: [
    {
      provide: BET_REPOSITORY,
      useClass: BetRepository,
    },
    {
      provide: ROUND_REPOSITORY,
      useClass: RoundRepository,
    },
  ],
  exports: [TypeOrmModule, BET_REPOSITORY, ROUND_REPOSITORY],
})
export class OrmRepositoryModule {}
