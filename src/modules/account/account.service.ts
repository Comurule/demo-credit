import {
  CreateAccountDTO,
  FilterQuery,
  TAccount,
  TransferFundsDTO,
  WithdrawFundsDTO,
} from './interfaces/account.interface';
import accountRepository from './repositories/account.repository';
import trxRepository from './repositories/transaction.repository';
import * as PaymentProvider from '../../providers/payment';
import { ErrorHelper } from '../../utils/ErrorHelper';
import { TUser } from '../user/user.interface';
import {
  SupportedCurrency,
  TransactionStatus,
  TransactionType,
  TTransaction,
} from './interfaces/transaction.interface';
import transactionRepository from './repositories/transaction.repository';
import logger from '../../utils/logger';

const depositFunds = async (transaction: TTransaction, canDeposit: boolean) => {
  await accountRepository.useTransaction(async (trx) => {
    if (canDeposit) {
      await accountRepository.deposit(
        {
          amount: Number(transaction.amount),
          accountId: transaction.receiver_id,
        },
        { transaction: trx },
      );
    }

    await transactionRepository.update(
      { id: transaction.id },
      {
        settled_at: new Date(),
        status: canDeposit
          ? TransactionStatus.SUCCESS
          : TransactionStatus.FAILED,
      },
      { transaction: trx },
    );
  });

  return true;
};

const withdrawFunds = async (
  transaction: TTransaction,
  canWithdraw: boolean,
) => {
  await accountRepository.useTransaction(async (trx) => {
    if (canWithdraw) {
      await accountRepository.withdraw(
        {
          amount: Number(transaction.amount),
          accountId: transaction.giver_id,
        },
        { transaction: trx },
      );
    } else {
      await accountRepository.unlockAmount(
        {
          amount: Number(transaction.amount),
          accountId: transaction.giver_id,
        },
        { transaction: trx },
      );
    }

    await transactionRepository.update(
      { id: transaction.id },
      {
        settled_at: new Date(),
        status: canWithdraw
          ? TransactionStatus.SUCCESS
          : TransactionStatus.FAILED,
      },
      { transaction: trx },
    );
  });

  return true;
};

export const create = async (payload: CreateAccountDTO) => {
  const duplicate = await accountRepository.findOne({
    user_id: payload.user_id,
    currency: payload.currency,
  });
  if (duplicate) return duplicate;

  return accountRepository.create({
    balance: 0,
    locked_balance: 0,
    user_id: payload.user_id,
    channel: payload.channel || 'INTERNAL',
    currency: payload.currency,
  });
};

export const getUserAccount = (userId: string, currency: SupportedCurrency) => {
  return accountRepository.findOne({
    user_id: userId,
    currency,
  });
};

export const getAllUserAccounts = (userId: string) => {
  return accountRepository
    .find({
      user_id: userId,
    })
    .then((accounts) => accounts as TAccount[])
    .catch((e) => {
      throw e;
    });
};

export const initializeDeposit = async (
  currency: SupportedCurrency,
  amount: number,
  user: TUser,
) => {
  const userAccount = await accountRepository.findOne({
    user_id: user.id,
    currency,
  });
  if (!userAccount) {
    ErrorHelper.UnprocessibleException(`User has no account in ${currency}.`);
  }

  const providerName = PaymentProvider.getProviderName(amount, currency);
  if (!providerName) {
    ErrorHelper.UnprocessibleException(
      'Unable to process payment. Currency not supported.',
    );
  }

  const transaction = await trxRepository.create({
    amount,
    currency,
    fee: 0,
    receiver_id: userAccount.id,
    giver_id: 'INTERNAL',
    provider_name: providerName || '',
    type: TransactionType.DEPOSIT,
    status: TransactionStatus.PENDING,
  });

  return PaymentProvider.getProviderInstance(
    providerName,
  ).initializeTransaction({
    transactionReference: transaction.id,
    currency,
    amount: Number(transaction.amount) + Number(transaction.fee),
    userEmail: user.email,
    callbackUrl: 'http://localhost:8000/callback',
  });
};

export const initializeWithdraw = async (
  dto: WithdrawFundsDTO,
): Promise<TTransaction> => {
  return accountRepository.useTransaction(async (trx) => {
    const userAccount = await accountRepository.findOne(
      {
        user_id: dto.userId,
        currency: dto.currency,
      },
      undefined,
      { transaction: trx },
    );
    if (!userAccount) {
      return ErrorHelper.NotFoundException(
        `User has no account in ${dto.currency}.`,
      );
    }

    if (Number(userAccount.balance) < dto.amount) {
      return ErrorHelper.UnprocessibleException(
        'Account has insufficient funds.',
      );
    }

    const providerName = PaymentProvider.getProviderName(
      dto.amount,
      dto.currency,
    );
    if (!providerName) {
      ErrorHelper.UnprocessibleException(
        'Unable to process payment. Currency not supported.',
      );
    }

    const transaction = await transactionRepository.create(
      {
        amount: dto.amount,
        fee: 0,
        receiver_id: 'INTERNAL',
        giver_id: userAccount.id,
        type: TransactionType.WITHDRAWAL,
        currency: dto.currency,
        provider_name: providerName || '',
        status: TransactionStatus.PENDING,
      },
      { transaction: trx },
    );
    await accountRepository.lockAmount(
      {
        userId: dto.userId,
        currency: dto.currency,
        amount: transaction.amount + transaction.fee,
      },
      { transaction: trx },
    );

    // Should be added to a queue
    const Provider = PaymentProvider.getProviderInstance(providerName);
    const bankAccountName = await Provider.getAccountName(
      dto.bankAccountNumber,
      dto.bankCode,
    );
    if (!bankAccountName) {
      ErrorHelper.UnprocessibleException('Invalid bank details.');
    }
    const response = await Provider.initializeTransfer({
      currency: dto.currency,
      amount: transaction.amount,
      bankAccountNumber: dto.bankAccountNumber,
      bankCode: dto.bankCode,
      bankAccountName,
    });

    transaction.provider_reference = response.providerReference;
    transaction.provider_fee = 0;
    await transactionRepository.update({ id: transaction.id }, transaction, {
      transaction: trx,
    });

    return transaction;
  });
};

export const transferFunds = async (
  dto: TransferFundsDTO,
): Promise<TTransaction> => {
  return accountRepository.useTransaction(async (trx) => {
    const userAccount = await accountRepository.findOne(
      {
        user_id: dto.userId,
        currency: dto.currency,
      },
      undefined,
      { transaction: trx },
    );
    if (!userAccount) {
      return ErrorHelper.NotFoundException(
        `User has no account in ${dto.currency}.`,
      );
    }
    const receiverAccount = await accountRepository.findOne({
      user_id: dto.receiverId,
      currency: dto.currency,
    });
    if (!receiverAccount) {
      return ErrorHelper.NotFoundException(
        `Receiver has no account in ${dto.currency}.`,
      );
    }
    if (Number(userAccount.balance) < dto.amount) {
      return ErrorHelper.UnprocessibleException(
        'User Account has insufficient funds.',
      );
    }

    await accountRepository.lockAmount(
      {
        userId: dto.userId,
        currency: dto.currency,
        amount: dto.amount,
      },
      { transaction: trx },
    );

    // Best handled in a queue
    /** BEGIN QUEUE JOB */
    await accountRepository.deposit(
      {
        userId: dto.receiverId,
        currency: dto.currency,
        amount: dto.amount,
      },
      { transaction: trx },
    );
    await accountRepository.withdraw(
      {
        userId: dto.userId,
        currency: dto.currency,
        amount: dto.amount,
      },
      { transaction: trx },
    );
    const transaction = await transactionRepository.create(
      {
        amount: dto.amount,
        fee: 0,
        receiver_id: receiverAccount.id,
        giver_id: userAccount.id,
        type: TransactionType.TRANSFER,
        currency: dto.currency,
        provider_name: 'INTERNAL',
        status: TransactionStatus.SUCCESS,
      },
      { transaction: trx },
    );

    return transaction;
  });
};

export const handleWebhook = async (
  providerName: string,
  signature: string,
  payload: any,
) => {
  const event = await PaymentProvider.getProviderInstance(
    providerName,
  ).verifyWebhookPayload(signature, payload);

  const transaction: TTransaction = await transactionRepository.findByAnyRef({
    provider_reference: event?.providerReference,
    id: event?.transactionId,
  });

  if (!transaction) {
    logger.log(
      'error',
      `Transaction record not found. \n ${JSON.stringify(event, null, 2)}`,
    );

    return null;
  }

  if (event?.type !== transaction.type) {
    const logData = {
      'event-type': event?.type,
      'transaction-type': transaction.type,
    };
    logger.log(
      'error',
      `Unmatched transaction record with event. \n ${JSON.stringify(
        logData,
        null,
        2,
      )}`,
    );

    return null;
  }

  if (event?.type === TransactionType.DEPOSIT) {
    await depositFunds(transaction, event.status);
  } else if (event?.type === TransactionType.WITHDRAWAL) {
    await withdrawFunds(transaction, event.status);
  }

  return true;
};

const getUserAccountIds = async (filterQuery: FilterQuery) => {
  let accountQuery: Partial<TAccount> = { user_id: filterQuery.userId };
  if (filterQuery.accountId) accountQuery.id = filterQuery.accountId;
  if (filterQuery.currency) accountQuery.currency = accountQuery.currency;

  const userAccounts: { id: string }[] = await accountRepository.find(
    accountQuery,
    ['id'],
  );
  return userAccounts.map((a: { id: string }) => a.id);
};

export const getAllUserTransactions = async (
  filterQuery: FilterQuery,
): Promise<TTransaction[]> => {
  let userAccountIds: string[] = [];
  if (!filterQuery.transactionId) {
    userAccountIds = await getUserAccountIds(filterQuery);
  }

  return transactionRepository.findAllAccountsTransactions(
    filterQuery.userId,
    userAccountIds,
    filterQuery.transactionId,
  );
};
