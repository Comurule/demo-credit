import { createHmac } from 'crypto';
import { SupportedCurrency } from 'src/modules/account/interfaces/transaction.interface';

const payloadSamples = {
  'charge.success': {
    event: 'charge.success',
    data: {
      id: 302961,
      domain: 'live',
      status: 'success',
      reference: 'qTPrJoy9Bx',
      amount: 10000,
      message: null,
      gateway_response: 'Approved by Financial Institution',
      paid_at: '2016-09-30T21:10:19.000Z',
      created_at: '2016-09-30T21:09:56.000Z',
      channel: 'card',
      currency: 'NGN',
      ip_address: '41.242.49.37',
      metadata: 0,
      log: {
        time_spent: 16,
        attempts: 1,
        authentication: 'pin',
        errors: 0,
        success: false,
        mobile: false,
        input: [],
        channel: null,
        history: [
          {
            type: 'input',
            message: 'Filled these fields: card number, card expiry, card cvv',
            time: 15,
          },
          {
            type: 'action',
            message: 'Attempted to pay',
            time: 15,
          },
          {
            type: 'auth',
            message: 'Authentication Required: pin',
            time: 16,
          },
        ],
      },
      fees: null,
      customer: {
        id: 68324,
        first_name: 'BoJack',
        last_name: 'Horseman',
        email: 'bojack@horseman.com',
        customer_code: 'CUS_qo38as2hpsgk2r0',
        phone: null,
        metadata: null,
        risk_action: 'default',
      },
      authorization: {
        authorization_code: 'AUTH_f5rnfq9p',
        bin: '539999',
        last4: '8877',
        exp_month: '08',
        exp_year: '2020',
        card_type: 'mastercard DEBIT',
        bank: 'Guaranty Trust Bank',
        country_code: 'NG',
        brand: 'mastercard',
        account_name: 'BoJack Horseman',
      },
      plan: {},
    },
  },
  'transfer.success': {
    event: 'transfer.success',
    data: {
      amount: 30000,
      currency: 'NGN',
      domain: 'test',
      failures: null,
      id: 37272792,
      integration: {
        id: 463433,
        is_live: true,
        business_name: 'Boom Boom Industries NG',
      },
      reason: 'Have fun...',
      reference: '1jhbs3ozmen0k7y5efmw',
      source: 'balance',
      source_details: null,
      status: 'success',
      titan_code: null,
      transfer_code: 'TRF_wpl1dem4967avzm',
      transferred_at: null,
      recipient: {
        active: true,
        currency: 'NGN',
        description: '',
        domain: 'test',
        email: null,
        id: 8690817,
        integration: 463433,
        metadata: null,
        name: 'Jack Sparrow',
        recipient_code: 'RCP_a8wkxiychzdzfgs',
        type: 'nuban',
        is_deleted: false,
        details: {
          account_number: '0000000000',
          account_name: null,
          bank_code: '011',
          bank_name: 'First Bank of Nigeria',
        },
        created_at: '2020-09-03T12:11:25.000Z',
        updated_at: '2020-09-03T12:11:25.000Z',
      },
      session: { provider: null, id: null },
      created_at: '2020-10-26T12:28:57.000Z',
      updated_at: '2020-10-26T12:28:57.000Z',
    },
  },
  'transfer.failed': {
    event: 'transfer.failed',
    data: {
      amount: 200000,
      currency: 'NGN',
      domain: 'test',
      failures: null,
      id: 69123462,
      integration: {
        id: 100043,
        is_live: true,
        business_name: 'Paystack',
      },
      reason: 'Enjoy',
      reference: '1976435206',
      source: 'balance',
      source_details: null,
      status: 'failed',
      titan_code: null,
      transfer_code: 'TRF_chs98y5rykjb47w',
      transferred_at: null,
      recipient: {
        active: true,
        currency: 'NGN',
        description: null,
        domain: 'test',
        email: 'test@email.com',
        id: 13584206,
        integration: 100043,
        metadata: null,
        name: 'Ted Lasso',

        recipient_code: 'RCP_cjcua8itre45gs',

        type: 'nuban',

        is_deleted: false,

        details: {
          authorization_code: null,

          account_number: '0123456789',

          account_name: 'Ted Lasso',

          bank_code: '011',

          bank_name: 'First Bank of Nigeria',
        },

        created_at: '2021-04-12T15:30:14.000Z',

        updated_at: '2021-04-12T15:30:14.000Z',
      },

      session: {
        provider: 'nip',

        id: '74849400998877667',
      },

      created_at: '2021-04-12T15:30:15.000Z',

      updated_at: '2021-04-12T15:41:21.000Z',
    },
  },
};

export const getSignature = (payload: any) => {
  const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
  const payloadString = JSON.stringify(payload);

  return createHmac('sha512', SECRET_KEY).update(payloadString).digest('hex');
};

type PaystackPayloadParams = {
  event: 'charge.success' | 'transfer.success' | 'transfer.failed';
  amount: number;
  transactionId?: string;
  providerReference?: string;
  currency?: SupportedCurrency;
};
export const getPayload = (payloadParams: PaystackPayloadParams) => {
  let samplePayload = payloadSamples[payloadParams.event];
  const extras: any = { amount: payloadParams.amount };
  if (payloadParams.providerReference) {
    extras.id = Number(payloadParams.providerReference);
  }
  if (payloadParams.transactionId) {
    extras.reference = payloadParams.transactionId;
  }
  return Object.assign(samplePayload, { data: extras });
};
