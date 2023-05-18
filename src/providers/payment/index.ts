import {
  IPaymentProviderConfig,
  IPaymentProviderInstance,
} from './payment.interface';
import * as Paystack from './paystack.provider';

const paymentProviderHashMap: {
  [providerName: string]: IPaymentProviderConfig;
} = {
  paystack: {
    class: Paystack,
    supportedCurrencies: [
      {
        code: 'NGN',
        amount: { min: 100, max: 3_000_000 },
      },
    ],
  },
};

export const getProviderName = (amount: number, currency: string) => {
  const providerArray = Object.keys(paymentProviderHashMap);

  return providerArray.find((p) =>
    paymentProviderHashMap[p].supportedCurrencies.some(
      (c) =>
        c.code === currency && amount > c.amount.min && amount <= c.amount.max,
    ),
  );
};

const defaultProvider = 'paystack';
export const getProviderInstance = (
  providerName: string = defaultProvider,
): IPaymentProviderInstance => paymentProviderHashMap[providerName].class;
