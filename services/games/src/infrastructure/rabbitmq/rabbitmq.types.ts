export enum TransactionSource {
  BET_PLACED = "bet_placed",
  BET_LOST = "bet_lost",
}

export interface CashMessage {
  cashType: TransactionSource;
  userId: string;
  amount: number;
  externalId: string;
  timestamp: string;
}

export interface BetPlacedMessage {
  userId: string;
  betAmount: number;
  gameType: string;
  externalId: string;
  timestamp: string;
}

export interface GameResultMessage {
  userId: string;
  gameType: string;
  resultAmount: number;
  betAmount: number;
  externalId: string;
  timestamp: string;
  isWon: boolean;
}

export interface WithdrawMessage {
  userId: string;
  amount: number;
  externalId: string;
  timestamp: string;
}

export interface DepositMessage {
  userId: string;
  amount: number;
  externalId: string;
  timestamp: string;
}
