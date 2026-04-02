import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DBClientConfig } from "../orm.client";
import { Bet } from "./entites/bet.entity";
import { OutboxMessage } from "./entites/outbox.entity";
import { ProvablyFairSeed } from "./entites/provably-fair.entity";
import { Round } from "./entites/round.entity";
import { BetRepository } from "./repository/bet.repository";
import { OutboxRepository } from "./repository/outbox.repository";
import { RoundRepository } from "./repository/round.repository";
import { ROUND_REPOSITORY } from "@/domain/orm/repositories/round.repository";
import { BET_REPOSITORY } from "@/domain/orm/repositories/bet.repository";

@Module({
  imports: [
    ConfigModule.forRoot({}),
    TypeOrmModule.forRootAsync(DBClientConfig),
    TypeOrmModule.forFeature([Bet, OutboxMessage, ProvablyFairSeed, Round]),
  ],
  providers: [
    BetRepository,
    {
      provide: BET_REPOSITORY,
      useClass: BetRepository,
    },
    OutboxRepository,
    RoundRepository,
    {
      provide: ROUND_REPOSITORY,
      useClass: RoundRepository,
    },
  ],
  exports: [
    TypeOrmModule,
    BetRepository,
    OutboxRepository,
    RoundRepository,
    BET_REPOSITORY,
    ROUND_REPOSITORY,
  ],
})
export class OrmModule {}
