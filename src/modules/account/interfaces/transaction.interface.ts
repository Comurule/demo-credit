export enum TransactionStatus {
  PENDING = 'pending',
  FAILED = 'failed',
  SUCCESS = 'success',
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER = 'transfer',
}

export enum SupportedCurrency {
  NGN = 'NGN',
}

export interface TTransaction {
  id: string;
  amount: number;
  fee: number;
  receiver_id: string;
  giver_id: string;
  type: TransactionType;
  currency: SupportedCurrency;
  provider_name: string;
  provider_reference?: string;
  provider_fee?: number;
  status: TransactionStatus;
  settled_at?: Date;
  updated_at?: Date;
  created_at?: Date;
}

export type CreateTrxDTO = {
  amount: number;
  fee: number;
  receiver_id: string;
  giver_id: string;
  type: TransactionType;
  currency: SupportedCurrency;
  provider_name: string;
  status: TransactionStatus;
  updated_at?: Date;
  created_at?: Date;
};
