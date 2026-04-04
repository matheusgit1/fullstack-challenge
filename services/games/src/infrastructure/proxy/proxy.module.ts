import { HttpModule, HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { WalletProxy } from './wallets.proxy';
import { WALLET_PROXY } from '@/domain/proxy/wallet.proxy';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: WALLET_PROXY,
      useClass: WalletProxy,
    },
  ],
  exports: [WALLET_PROXY, HttpModule],
})
export class ProxyModule {}
