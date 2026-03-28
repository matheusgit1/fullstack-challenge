import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { ProvablyFairModule } from "./provably-fair/provably-fair.module";
import { GameEngineModule } from "./game-engine/game-engine.module";
import { Round } from "@/infrastructure/database/orm/entites/round.entity";
import { Bet } from "@/infrastructure/database/orm/entites/bet.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Round, Bet]),
    GameEngineModule,
    ProvablyFairModule,
  ],
  providers: [],
  exports: [TypeOrmModule, GameEngineModule],
})
export class ServicesModule {}
