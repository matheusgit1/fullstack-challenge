import { Test } from '@nestjs/testing';
import { RabbitmqModule } from './rabbitmq.module';
import { OrmModule } from '../database/orm/orm.module';
import { RABBITMQ_SERVICE } from '@/domain/rabbitmq/rabbitmq.service';
import { TRANSACTION_REPOSITORY } from '@/domain/orm/repositories/transaction.repository';

describe('RabbitmqModule', () => {
  it('should compile', () => {
    const moduleRef = Test.createTestingModule({
      imports: [RabbitmqModule],
    })
      .overrideModule(OrmModule)
      .useModule(class {})
      .overrideProvider(RABBITMQ_SERVICE)
      .useClass(class {})
      .overrideProvider(TRANSACTION_REPOSITORY)
      .useClass(class {})
      .compile();

    expect(moduleRef).toBeDefined();
  });
});
