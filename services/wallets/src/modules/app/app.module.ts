import { ConfigService } from "@nestjs/config";
import { WalletRepository } from "@/infrastructure/database/orm/repository/wallet.repository";
import { WalletsController } from "@/presentation/controllers/wallets.controller";
import { WalletsService } from "@/presentation/services/wallets.service";
import { Module } from "@nestjs/common";
import { OrmModule } from "@/infrastructure/database/orm/orm.module";

@Module({
  imports: [OrmModule],
  controllers: [WalletsController],
  providers: [ConfigService, WalletsService, WalletRepository],
})
export class AppModule {}
