import { TransactionSource } from '@/infrastructure/database/orm/entites/transaction.entity';

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

export interface IRabbitmqService {
  processReserve(message: CashReserveMessage, tracingId: string): Promise<void>;
  processCashin(message: CashinMessage, tracingId: string): Promise<void>;
  processCashout(message: CashoutMessage, tracingId: string): Promise<void>;
}

export const RABBITMQ_SERVICE = Symbol('IRabbitmqService');
