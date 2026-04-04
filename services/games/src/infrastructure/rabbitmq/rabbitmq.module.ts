import { Module } from '@nestjs/common';
import { RabbitmqProducerService } from './rabbitmq.producer';
import { RABBITMQ_PRODUCER_SERVICE } from '@/domain/rabbitmq/rabbitmq.producer';

@Module({
  providers: [
    {
      provide: RABBITMQ_PRODUCER_SERVICE,
      useClass: RabbitmqProducerService,
    },
  ],
  exports: [RABBITMQ_PRODUCER_SERVICE],
})
export class RabbitmqModule {}
