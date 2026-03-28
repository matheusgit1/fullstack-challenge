import { ConfigService } from "@nestjs/config";
import { WalletRepository } from "@/infrastructure/database/orm/repository/wallet.repository";
import { WalletsController } from "@/presentation/controllers/wallets.controller";
import { WalletService } from "@/presentation/services/wallet.service";
import { Module } from "@nestjs/common";
import { OrmModule } from "@/infrastructure/database/orm/orm.module";

@Module({
  imports: [OrmModule],
  controllers: [WalletsController],
  providers: [ConfigService, WalletService, WalletRepository],
})
export class AppModule {}
