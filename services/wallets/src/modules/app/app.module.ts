import { HttpModule } from "@nestjs/axios";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { WalletRepository } from "@/infrastructure/database/orm/repository/wallet.repository";
import { WalletsController } from "@/presentation/controllers/wallets.controller";
import { WalletsService } from "@/presentation/services/wallets.service";
import { Module } from "@nestjs/common";
import { OrmModule } from "@/infrastructure/database/orm/orm.module";
import { PassportModule } from "@nestjs/passport";
import { AuthModule } from "@/infrastructure/auth/auth.module";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "@/infrastructure/auth/auth.guard";

@Module({
  imports: [
    AuthModule,
    OrmModule,
    PassportModule,
    ConfigModule.forRoot(),
  ],
  controllers: [WalletsController],
  providers: [
    ConfigService,
    WalletsService,
    WalletRepository,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
