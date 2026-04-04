import { Test } from '@nestjs/testing';
import { WebsocketModule } from './websocket.module';
import { OrmModule } from '../database/orm/orm.module';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';
import { AppWebSocketGateway } from './app-websocket.gateway';
import { WebSocketService } from './websocket.service';
import { BetEventHandler } from './handlers/bet-event.handler';

describe('WebsocketModule', () => {
  let moduleRef: WebsocketModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [OrmModule, RabbitmqModule],
      providers: [AppWebSocketGateway, WebSocketService, BetEventHandler],
      exports: [AppWebSocketGateway, WebSocketService],
    })
      .overrideProvider(AppWebSocketGateway)
      .useValue({})
      .overrideProvider(WebSocketService)
      .useValue({})
      .overrideProvider(AppWebSocketGateway)
      .useValue({})
      .overrideProvider(BetEventHandler)
      .useValue({})
      .compile();
  });

  it('should be defined', async () => {
    await expect(moduleRef).toBeDefined();
  });
});
