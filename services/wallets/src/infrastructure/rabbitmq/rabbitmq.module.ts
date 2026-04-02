import { Module } from "@nestjs/common";
import { RabbitmqController } from "./rabbitmq.controller";
import { RabbitmqService } from "./rabbitmq.service";
import { OrmModule } from "../database/orm/orm.module";
import { WalletRepository } from "../database/orm/repository/wallet.repository";
import { TransactionRepository } from "../database/orm/repository/transaction.repository";
import { TracingService } from "../tracing/tracing.service";

@Module({
  imports: [OrmModule],
  controllers: [RabbitmqController],
  exports: [RabbitmqService, TracingService],
  providers: [
    RabbitmqService,
    TransactionRepository,
    WalletRepository,
    TracingService,
  ],
})
export class RabbitmqModule {}
