import { Module } from "@nestjs/common";
import { RabbitmqProducerService } from "./rabbitmq.producer";
import { ConfigService } from "@nestjs/config";
import { TracingService } from "../tracing/tracing.service";

@Module({
  exports: [RabbitmqProducerService, TracingService],
  providers: [RabbitmqProducerService, TracingService],
})
export class RabbitmqModule {}
