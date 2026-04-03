import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DBClientConfig } from "../orm.client";
import { Bet } from "./entites/bet.entity";
import { OutboxMessage } from "./entites/outbox.entity";
import { ProvablyFairSeed } from "./entites/provably-fair.entity";
import { Round } from "./entites/round.entity";
import { BetRepository } from "./repository/bet.repository";
import { RoundRepository } from "./repository/round.repository";
import { BET_REPOSITORY } from "@/domain/orm/repositories/bet.repository";
import { ROUND_REPOSITORY } from "@/domain/orm/repositories/round.repository";

@Module({
  imports: [
    TypeOrmModule.forRootAsync(DBClientConfig),
    TypeOrmModule.forFeature([Bet, OutboxMessage, ProvablyFairSeed, Round]),
  ],
  providers: [
    BetRepository,
    {
      provide: BET_REPOSITORY,
      useClass: BetRepository,
    },
    RoundRepository,
    {
      provide: ROUND_REPOSITORY,
      useClass: RoundRepository,
    },
  ],
  exports: [
    TypeOrmModule,
    BetRepository,
    RoundRepository,
    BET_REPOSITORY,
    ROUND_REPOSITORY,
  ],
})
export class OrmModule {}
