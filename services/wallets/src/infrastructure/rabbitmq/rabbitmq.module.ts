import { Module } from '@nestjs/common';
import { RabbitmqController } from './rabbitmq.controller';
import { RabbitmqService } from './rabbitmq.service';
import { OrmModule } from '../database/orm/orm.module';
import { RABBITMQ_SERVICE } from '@/domain/rabbitmq/rabbitmq.service';
import { TRANSACTION_REPOSITORY } from '@/domain/orm/repositories/transaction.repository';
import { TransactionRepository } from '../database/orm/repository/transaction.repository';

@Module({
  imports: [OrmModule],
  controllers: [RabbitmqController],
  providers: [
    {
      provide: RABBITMQ_SERVICE,
      useClass: RabbitmqService,
    },
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: TransactionRepository,
    },
  ],
  exports: [RABBITMQ_SERVICE],
})
export class RabbitmqModule {}
