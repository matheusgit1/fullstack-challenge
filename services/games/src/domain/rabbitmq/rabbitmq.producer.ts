export enum TransactionSource {
  BET_PLACED = "bet_placed",
  BET_LOST = "bet_lost",
  BET_RESERVE = "bet_reserve",
}

export interface BaseMessage {
  tracingId: string;
}

export interface CashReserveMessage extends BaseMessage {
  cashType: TransactionSource;
  userId: string;
  amount: number;
  timestamp: string;
  externalId: string;
}
export type CashinMessage = {
  cashType: TransactionSource;
  userId: string;
  multiplier: number;
  timestamp: string;
  externalId: string;
} & BaseMessage;

export type CashoutMessage = {
  cashType: TransactionSource;
  userId: string;
  timestamp: string;
  externalId: string;
} & BaseMessage;

export interface IRabbitmqProducerService {
  publishCashin(messageToSend: CashinMessage): Promise<void>;
  publishCashout(messageToSend: CashoutMessage): Promise<void>;
  publishReserve(messageToSend: CashReserveMessage): Promise<void>;
}

export const RABBITMQ_PRODUCER_SERVICE = Symbol("IRabbitmqProducerService");
