import { HttpModule, HttpService } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { WalletProxy } from "./services/wallets.service";

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [],
  providers: [WalletProxy],
  exports: [WalletProxy],
})
export class ProxyModule {}
