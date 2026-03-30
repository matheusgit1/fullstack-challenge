import { Module } from "@nestjs/common";
import { ProvablyFairService } from "./provably-fair.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProvablyFairSeed } from "@/infrastructure/database/orm/entites/provably-fair.entity";
import { RoundRepository } from "@/infrastructure/database/orm/repository/round.repository";
import { BetRepository } from "@/infrastructure/database/orm/repository/bet.repository";
import { Round } from "@/infrastructure/database/orm/entites/round.entity";
import { Bet } from "@/infrastructure/database/orm/entites/bet.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ProvablyFairSeed, Round, Bet])],
  providers: [ProvablyFairService, RoundRepository, BetRepository],
  exports: [ProvablyFairService, RoundRepository, BetRepository, TypeOrmModule],
})
export class ProvablyFairModule {}
