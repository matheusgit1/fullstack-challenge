import { Module } from "@nestjs/common";
import { RabbitmqController } from "./rabbitmq.controller";
import { RabbitmqService } from "./rabbitmq.service";
import { OrmModule } from "../database/orm/orm.module";
import { WalletRepository } from "../database/orm/repository/wallet.repository";
import { TransactionRepository } from "../database/orm/repository/transaction.repository";

@Module({
  imports: [OrmModule],
  controllers: [RabbitmqController],
  exports: [RabbitmqService],
  providers: [RabbitmqService, TransactionRepository, WalletRepository],
})
export class RabbitmqModule {}
