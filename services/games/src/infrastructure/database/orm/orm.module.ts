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

@Module({
  imports: [
    ConfigModule.forRoot({}),
    TypeOrmModule.forRootAsync(DBClientConfig),
    TypeOrmModule.forFeature([Bet, OutboxMessage, ProvablyFairSeed, Round]),
  ],
  providers: [BetRepository, OutboxRepository, RoundRepository],
  exports: [TypeOrmModule, BetRepository, OutboxRepository, RoundRepository],
})
export class OrmModule {}
