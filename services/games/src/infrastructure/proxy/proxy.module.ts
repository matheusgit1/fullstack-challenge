import { HttpModule, HttpService } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { WalletProxy } from "./services/wallets.service";
import { WALLET_PROXY } from "@/domain/proxy/wallet.proxy";

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [],
  providers: [
    WalletProxy,
    {
      provide: WALLET_PROXY,
      useClass: WalletProxy,
    },
  ],
  exports: [WalletProxy, WALLET_PROXY],
})
export class ProxyModule {}
