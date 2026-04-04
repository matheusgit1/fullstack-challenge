import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DBClientConfig } from '../orm.client';
import { Bet } from './entites/bet.entity';
import { ProvablyFairSeed } from './entites/provably-fair.entity';
import { Round } from './entites/round.entity';

@Module({
  imports: [TypeOrmModule.forRootAsync(DBClientConfig)],
  providers: [],
  exports: [TypeOrmModule],
})
export class OrmCoreModule {}
