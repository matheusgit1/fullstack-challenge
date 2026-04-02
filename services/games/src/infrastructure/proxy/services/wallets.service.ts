import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { appConfig } from "@/configs/app.config";
import { lastValueFrom } from "rxjs";

export interface UserWallet {
  id: string;
  userId: string;
  balance: number;
  balanceInCents: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class WalletProxy {
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
