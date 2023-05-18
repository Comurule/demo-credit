import { createHmac } from 'crypto';
import {
  ICheckoutResponse,
  IPaymentEvent,
  ITransactionDTO,
  ITransferDTO,
  ITransferResponse,
} from './payment.interface';
import { TransactionType } from '../../modules/account/interfaces/transaction.interface';
import logger from '../../utils/logger';

const Axios = require('axios');

const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const axios = Axios.create({
  baseURL: 'https://api.paystack.co',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${SECRET_KEY}`,
  },
});

export const initializeTransaction = async (
  dto: ITransactionDTO,
): Promise<ICheckoutResponse> => {
  try {
    const payload = {
      reference: dto.transactionReference,
      email: dto.userEmail,
      amount: dto.amount * 100, // Set to kobo | pesewas
      currency: dto.currency,
      callback_url: dto.callbackUrl,
      channels: ['card', 'bank', 'ussd', 'mobile_money', 'bank_transfer'],
      metadata: {},
    };

    const res = await axios.post(`/transaction/initialize`, payload);

    if (!res.data?.status) {
      throw new Error('Unable to initialize transaction');
    }

    return {
      transactionReference: res.data.data.reference,
      checkoutUrl: res.data.data.authorization_url,
    };
  } catch (error: any) {
    logger.error(
      `Unable to process transaction. ${JSON.stringify(
        error?.response.data || {},
        null,
        2,
      )}`,
    );
    throw new Error('Unable to process transaction. Try again.');
  }
};

export const initializeTransfer = async (
  dto: ITransferDTO,
): Promise<ITransferResponse> => {
  const payload = {
    type: 'nuban',
    name: dto.bankAccountName,
    account_number: dto.bankAccountNumber,
    bank_code: dto.bankCode,
    currency: dto.currency,
  };

  try {
    const res = await axios.post(`/transferrecipient`, payload);

    if (!res.data?.status) {
      throw new Error('Unable to initialize transaction');
    }
    return {
      providerReference: res.data.data.id,
      transactionReference: res.data.data.reference,
    };
  } catch (error: any) {
    logger.error(
      `Unable to process transaction. ${JSON.stringify(
        error?.response.data || {},
        null,
        2,
      )}`,
    );
    throw new Error('Unable to process transaction. Try again.');
  }
};

export const getAccountName = async (
  accountNumber: string,
  bankCode: string,
): Promise<string> => {
  try {
    const res = await axios.get(
      `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    );

    return res.data?.data?.account_name;
  } catch (error: any) {
    if (error?.response) {
      logger.error(
        `Unable to process transaction. ${JSON.stringify(
          error?.response.data,
          null,
          2,
        )}`,
      );
      return '';
    }
    throw new Error(
      'Unable to get bank account name. Check the bank details and try again.',
    );
  }
};

export const verifyWebhookPayload = async (signature: string, payload: any) => {
  const payloadString = JSON.stringify(payload);
  const hash = createHmac('sha512', SECRET_KEY)
    .update(payloadString)
    .digest('hex');
  console.log({ signature, hash });
  if (signature !== hash) return null;

  let event: IPaymentEvent = {
    status: false,
    type: TransactionType.DEPOSIT,
    transactionId: '',
    providerReference: '',
  };
  switch (payload.event) {
    case 'charge.success':
      event = {
        status: true,
        type: TransactionType.DEPOSIT,
        transactionId: payload.data.reference,
        providerReference: payload.data.id,
      };
      break;

    case 'charge.failed':
      event = {
        status: false,
        type: TransactionType.DEPOSIT,
        transactionId: payload.data.reference,
        providerReference: payload.data.id,
      };
      break;

    case 'transfer.success':
      event = {
        status: true,
        type: TransactionType.WITHDRAWAL,
        transactionId: payload.data.reference,
        providerReference: payload.data.id,
      };
      break;

    case 'transfer.failed':
      event = {
        status: false,
        type: TransactionType.WITHDRAWAL,
        transactionId: payload.data.reference,
        providerReference: payload.data.id,
      };
      break;

    case 'transfer.reversed':
      event = {
        status: false,
        type: TransactionType.WITHDRAWAL,
        transactionId: payload.data.reference,
        providerReference: payload.data.id,
      };
      break;

    default:
      logger.error(`Unhandled event type : ${payload.event}`);
      break;
  }

  return event;
};
