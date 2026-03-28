import { Module } from "@nestjs/common";
import { ProvablyFairService } from "./provably-fair.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProvablyFairSeed } from "@/infrastructure/database/orm/entites/provably-fair.entity";
import { RoundRepository } from "@/infrastructure/database/orm/repository/round.repository";
import { BetRepository } from "@/infrastructure/database/orm/repository/bet.repository";

@Module({
  imports: [TypeOrmModule.forFeature([ProvablyFairSeed])],
  providers: [ProvablyFairService],
  exports: [ProvablyFairService, TypeOrmModule],
})
export class ProvablyFairModule {}
