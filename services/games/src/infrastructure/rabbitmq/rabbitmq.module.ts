import { Module } from "@nestjs/common";
import { TracingService } from "../../application/tracing/tracing.service";
import { RabbitmqProducerService } from "./rabbitmq.producer";
import { RABBITMQ_PRODUCER_SERVICE } from "@/domain/rabbitmq/rabbitmq.producer";

@Module({
  exports: [RabbitmqProducerService, TracingService],
  providers: [
    RabbitmqProducerService,
    {
      provide: RABBITMQ_PRODUCER_SERVICE,
      useClass: RabbitmqProducerService,
    },
    TracingService,
  ],
})
export class RabbitmqModule {}
