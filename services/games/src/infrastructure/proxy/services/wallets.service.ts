import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { appConfig } from "@/configs/app.config";
import { IWalletProxy, UserWallet } from "@/domain/proxy/wallet.proxy";

@Injectable()
export class WalletProxy implements IWalletProxy {
  constructor(private readonly httpService: HttpService) {}

  async getUserBalance(token: string): Promise<UserWallet> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(appConfig.apiWalletsUrl + `/wallets/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      return response.data satisfies UserWallet;
    } catch (error) {
      console.error("Error fetching user balance:", error);
      throw new Error("Failed to fetch user balance");
    }
  }
}
