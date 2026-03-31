import { Module } from "@nestjs/common";
import { RabbitmqController } from "./rabbitmq.controller";
import { RabbitmqService } from "./rabbitmq.service";
import { RabbitmqProducerService } from "./rabbitmq.producer";
import { ConfigService } from "@nestjs/config";

@Module({
  controllers: [RabbitmqController],
  exports: [RabbitmqService, RabbitmqProducerService],
  providers: [RabbitmqService, RabbitmqProducerService, ConfigService],
})
export class RabbitmqModule {}
