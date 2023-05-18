import { SupportedCurrency } from './transaction.interface';

export interface TAccount {
  id: string;
  balance: number;
  locked_balance: number;
  user_id: string;
  channel: string;
  currency: string;
  updated_at?: Date;
  created_at?: Date;
}

export type CreateAccountDTO = {
  user_id: string;
  channel: string;
  currency: string;
};

export type WithdrawFundsDTO = {
  amount: number;
  currency: SupportedCurrency;
  bankAccountNumber: string;
  bankCode: string;
  userId: string;
};

export type TransferFundsDTO = {
  amount: number;
  currency: SupportedCurrency;
  receiverId: string;
  userId: string;
};

export type FilterQuery = {
  userId: string;
  transactionId?: string;
  accountId?: string;
  currency?: string;
};
