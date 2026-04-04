import { Test } from '@nestjs/testing';
import { RabbitmqModule } from './rabbitmq.module';
import { ProxyModule } from '../proxy/proxy.module';
import { RABBITMQ_PRODUCER_SERVICE } from '@/domain/rabbitmq/rabbitmq.producer';

describe('RabbitmqModule', () => {
  let moduleRef: RabbitmqModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [ProxyModule],
    })
      .overrideProvider(RABBITMQ_PRODUCER_SERVICE)
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(moduleRef).toBeDefined();
  });
});
