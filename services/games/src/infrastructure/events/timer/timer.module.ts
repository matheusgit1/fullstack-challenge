import { Module } from "@nestjs/common";
import { TimerService } from "./timer.service";
import { OrmModule } from "@/infrastructure/database/orm/orm.module";
import { EventEmitter2, EventEmitterModule } from "@nestjs/event-emitter";
import { GameEngineModule } from "@/application/services/game-engine/game-engine.module";
import { ProvablyFairModule } from "@/application/services/provably-fair/provably-fair.module";


@Module({
  imports: [
    OrmModule,
    GameEngineModule,
    ProvablyFairModule,
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: ".",
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
  ],
  providers: [
    TimerService,
    EventEmitter2,
  ],
  exports: [TimerService],
})
export class TimerModule {}
