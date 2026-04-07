export interface Sucess<T> {
  success: boolean;
  data: T;
  tracingId: string;
  timestamp: string;
}

export interface UserWallet {
  id: string;
  userId: string;
  balance: number;
  balanceInCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface IWalletProxy {
  getUserBalance(token: string): Promise<Sucess<UserWallet>>;
}

export const WALLET_PROXY = Symbol('IWalletProxy');
