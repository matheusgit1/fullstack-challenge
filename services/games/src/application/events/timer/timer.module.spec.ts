import { WebsocketModule } from '@/infrastructure/websocket/websocket.module';
import { Test } from '@nestjs/testing';
import { TimerModule } from './timer.module';
import { OrmModule } from '@/infrastructure/database/orm/orm.module';
import { GameEngineModule } from '@/application/game/game-engine/game-engine.module';
import { ProvablyFairModule } from '@/application/game/provably-fair/provably-fair.module';
import { TimerService } from './timer.service';

describe('TimerModule', () => {
  it('should be defined', () => {
    // const mockRoundRepository: jest.Mocked<IRoundRepository> = {
    //   findByRoundId: jest.fn(),
    //   findCurrentBettingRound: jest.fn(),
    //   findCurrentRunningRound: jest.fn(),
    //   findRoundWithBets: jest.fn(),
    //   findRoundsHistory: jest.fn(),
    //   saveRound: jest.fn(),
    //   createRound: jest.fn(),
    // };

    // const mockGameEngineService: jest.Mocked<IGameEngineService> = {
    //   startNewRound: jest.fn(),
    //   endRound: jest.fn(),
    //   runningRound: jest.fn(),
    // };
    const module = Test.createTestingModule({
      imports: [TimerModule],
    })
      .overrideModule(OrmModule)
      .useModule(class {})
      .overrideModule(GameEngineModule)
      .useModule(class {})
      .overrideModule(ProvablyFairModule)
      .useModule(class {})
      .overrideModule(WebsocketModule)
      .useModule(class {})
      .overrideProvider(TimerService)
      .useValue({})

      .compile();

    expect(module).toBeDefined();
  });
});
