import {
  SupportedCurrency,
  TransactionType,
} from '../../modules/account/interfaces/transaction.interface';

export type ITransactionDTO = {
  transactionReference: string;
  amount: number;
  userEmail: string;
  currency: string;
  callbackUrl?: string;
};

export type ITransferDTO = {
  amount: number;
  currency: SupportedCurrency;
  bankAccountNumber: string;
  bankCode: string;
  bankAccountName: string;
};

export type IPaymentEvent = {
  status: boolean;
  type: TransactionType;
  transactionId: string;
  providerReference: string;
};

export type ITransferResponse = {
  providerReference: string;
  transactionReference: string;
};

export type ICheckoutResponse = {
  transactionReference: string;
  checkoutUrl: string;
};

export interface IPaymentProviderInstance {
  initializeTransaction: (dto: ITransactionDTO) => Promise<ICheckoutResponse>;
  initializeTransfer: (dto: ITransferDTO) => Promise<ITransferResponse>;
  getAccountName: (accountNumber: string, bankCode: string) => Promise<string>;
  verifyWebhookPayload: (
    signature: string,
    payload: any,
  ) => Promise<IPaymentEvent | null>;
}

export type IPaymentProviderConfig = {
  class: IPaymentProviderInstance;
  supportedCurrencies: {
    code: string;
    amount: { min: number; max: number };
  }[];
};
