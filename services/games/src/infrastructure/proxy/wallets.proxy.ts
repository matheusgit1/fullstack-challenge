import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { appConfig } from '@/configs/app.config';
import { IWalletProxy, Sucess, UserWallet } from '@/domain/proxy/wallet.proxy';

@Injectable()
export class WalletProxy implements IWalletProxy {
  constructor(private readonly httpService: HttpService) {}

  async getUserBalance(token: string): Promise<Sucess<UserWallet>> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(appConfig.API_WALLETS_URL + `/wallets/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      return response.data satisfies UserWallet;
    } catch (error) {
      throw new Error('Failed to fetch user balance');
    }
  }
}
