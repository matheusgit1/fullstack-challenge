import { Module } from '@nestjs/common';
import { RabbitmqController } from './rabbitmq.controller';
import { RabbitmqService } from './rabbitmq.service';
import { OrmModule } from '../database/orm/orm.module';
import { RABBITMQ_SERVICE } from '@/domain/rabbitmq/rabbitmq.service';

@Module({
  imports: [OrmModule],
  controllers: [RabbitmqController],
  providers: [
    {
      provide: RABBITMQ_SERVICE,
      useClass: RabbitmqService,
    },
  ],
  exports: [RABBITMQ_SERVICE],
})
export class RabbitmqModule {}
