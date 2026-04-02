import { Module } from "@nestjs/common";
import { RabbitmqProducerService } from "./rabbitmq.producer";
import { ConfigService } from "@nestjs/config";

@Module({
  exports: [RabbitmqProducerService],
  providers: [RabbitmqProducerService],
})
export class RabbitmqModule {}
