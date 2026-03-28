import { Module } from "@nestjs/common";
import { ProvablyFairService } from "../provably-fair/provably-fair.service";
import { GameEngineService } from "./game-engine.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ProvablyFairModule } from "../provably-fair/provably-fair.module";
import { OrmModule } from "@/infrastructure/database/orm/orm.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [ProvablyFairModule, OrmModule, ConfigModule],
  providers: [
    GameEngineService,
    EventEmitter2,
  ],
  exports: [GameEngineService],
})
export class GameEngineModule {}

// export class GameEngineService {
//   private readonly logger = new Logger(GameEngineService.name);
//   private currentRound: Round | null = null;

//   constructor(
//     private readonly roundRepository: RoundRepository,
//     private readonly provablyFairService: ProvablyFairService,
//     private readonly configService: ConfigService,
//     private readonly eventEmitter: EventEmitter2,
//   ) {}
