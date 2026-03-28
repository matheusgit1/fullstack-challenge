import { WalletsController } from "@/presentation/controllers/wallets.controller";
import { Module } from "@nestjs/common";

@Module({
  controllers: [WalletsController],
})
export class AppModule {}
