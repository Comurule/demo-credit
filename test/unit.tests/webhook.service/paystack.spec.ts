import { describe, expect, it } from '@jest/globals';
import getMockUser from 'test/stubs/user';
import { DatabaseConnection } from 'src/database/connect';
import { TUser } from 'src/modules/user/user.interface';
import { signup as createAUser } from 'src/modules/user/user.service';
import {
  SupportedCurrency,
  TransactionStatus,
} from 'src/modules/account/interfaces/transaction.interface';
import {
  initializeDeposit as fundUserAccount,
  getAllUserTransactions,
  getUserAccount,
  handleWebhook,
  initializeWithdraw,
} from 'src/modules/account/account.service';
import { getPayload, getSignature } from 'test/stubs/paystack';
import { savedBankDetails } from 'src/config/test.variables';
import { changeBalance } from 'test/stubs/account';

const getMockLoadedUser = async () => {
  const userStub = getMockUser();
  const user = await createAUser(userStub);
  await changeBalance(100_000_000, user.id);

  return user;
};
describe('Paystack Webhook API', () => {
  let depositUser: TUser, withdrawUser: TUser, failedWithdrawUser: TUser;
  const currency = SupportedCurrency.NGN;

  beforeAll(async () => {
    // reset the db
    await DatabaseConnection.migrateAll();

    [depositUser, withdrawUser, failedWithdrawUser] = await Promise.all([
      getMockLoadedUser(),
      getMockLoadedUser(),
      getMockLoadedUser(),
    ]);
  });

  describe('charge.success event', () => {
    it('should fund user account successfully with valid details', async () => {
      const amount = 10_000;
      const response = await fundUserAccount(currency, amount, depositUser);
      const payload = getPayload({
        amount,
        event: 'charge.success',
        transactionId: response.transactionReference,
      });
      const accountBefore = await getUserAccount(depositUser.id, currency);

      const signature = getSignature(payload);
      const res = await handleWebhook('paystack', signature, payload);

      expect(res).toBeDefined();
      expect(res).toBeTruthy();

      const accountAfter = await getUserAccount(depositUser.id, currency);
      expect(Number(accountAfter.balance)).toBe(
        Number(accountBefore.balance) + amount,
      );

      const transaction = await getAllUserTransactions({
        transactionId: response.transactionReference,
        userId: depositUser.id,
      });
      expect(transaction[0].status).toBe(TransactionStatus.SUCCESS);
      expect(transaction[0].settled_at).not.toBeNull();
    });

    it('should not run successfully if the signature is wrong ', async () => {
      const amount = 10_000;
      const response = await fundUserAccount(currency, amount, depositUser);
      const payload = getPayload({
        amount,
        event: 'charge.success',
        transactionId: response.transactionReference,
      });
      const accountBefore = await getUserAccount(depositUser.id, currency);

      const signature = 'kfknfknsdkvjbkjfdkfnvknfvncjkncjnkkpjbkcmmvdfjkbfkj';
      const res = await handleWebhook('paystack', signature, payload);

      expect(res).toBeNull();
      expect(res).not.toBeTruthy();

      const accountAfter = await getUserAccount(depositUser.id, currency);
      expect(accountAfter.balance).toBe(accountBefore.balance);

      const transaction = await getAllUserTransactions({
        transactionId: response.transactionReference,
        userId: depositUser.id,
      });
      expect(transaction[0].status).toBe(TransactionStatus.PENDING);
      expect(transaction[0].settled_at).toBeNull();
    });

    it('should not run successfully if the payload is tampered.', async () => {
      const amount = 10_000;
      const response = await fundUserAccount(currency, amount, depositUser);
      const payload = getPayload({
        amount,
        event: 'charge.success',
        transactionId: response.transactionReference,
      });
      const accountBefore = await getUserAccount(depositUser.id, currency);

      const signature = getSignature(payload);
      const tamperedPayload = getPayload({
        amount: 20_000,
        event: 'charge.success',
        transactionId: response.transactionReference,
      });
      const res = await handleWebhook('paystack', signature, tamperedPayload);

      expect(res).toBeNull();
      expect(res).not.toBeTruthy();

      const accountAfter = await getUserAccount(depositUser.id, currency);
      expect(accountAfter.balance).toBe(accountBefore.balance);

      const transaction = await getAllUserTransactions({
        transactionId: response.transactionReference,
        userId: depositUser.id,
      });
      expect(transaction[0].status).toBe(TransactionStatus.PENDING);
      expect(transaction[0].settled_at).toBeNull();
    });
  });

  describe('transfer.success event', () => {
    it('should withdraw locked funds successfully with valid details', async () => {
      const amount = 10_000;
      const response = await initializeWithdraw({
        amount,
        currency,
        userId: withdrawUser.id,
        bankAccountNumber: savedBankDetails.account_number,
        bankCode: savedBankDetails.bank_code,
      });
      const payload = getPayload({
        amount,
        event: 'transfer.success',
        providerReference: response.provider_reference,
      });
      const accountBefore = await getUserAccount(withdrawUser.id, currency);

      const signature = getSignature(payload);
      const res = await handleWebhook('paystack', signature, payload);

      expect(res).toBeDefined();
      expect(res).toBeTruthy();

      const accountAfter = await getUserAccount(withdrawUser.id, currency);
      expect(Number(accountAfter.locked_balance)).toBe(
        Number(accountBefore.locked_balance) - amount,
      );

      const transaction = await getAllUserTransactions({
        transactionId: response.id,
        userId: withdrawUser.id,
      });
      expect(transaction[0].status).toBe(TransactionStatus.SUCCESS);
      expect(transaction[0].settled_at).not.toBeNull();
    });

    it('should not run successfully if the signature is wrong', async () => {
      const amount = 10_000;
      const response = await initializeWithdraw({
        amount,
        currency,
        userId: withdrawUser.id,
        bankAccountNumber: savedBankDetails.account_number,
        bankCode: savedBankDetails.bank_code,
      });
      const payload = getPayload({
        amount,
        event: 'transfer.success',
        providerReference: response.provider_reference,
      });
      const accountBefore = await getUserAccount(withdrawUser.id, currency);

      const signature = 'jlbhvjlhdcvhdpiocvkdoiodcjxczjbnvcjnvkjcbkvsjkn';
      const res = await handleWebhook('paystack', signature, payload);

      expect(res).toBeDefined();
      expect(res).toBeNull();

      const accountAfter = await getUserAccount(withdrawUser.id, currency);
      expect(accountAfter.locked_balance).toBe(accountBefore.locked_balance);

      const transaction = await getAllUserTransactions({
        transactionId: response.id,
        userId: withdrawUser.id,
      });
      expect(transaction[0].status).toBe(TransactionStatus.PENDING);
      expect(transaction[0].settled_at).toBeNull();
    });

    it('should not run successfully if the payload is tampered', async () => {
      const amount = 10_000;
      const response = await initializeWithdraw({
        amount,
        currency,
        userId: withdrawUser.id,
        bankAccountNumber: savedBankDetails.account_number,
        bankCode: savedBankDetails.bank_code,
      });
      const payload = getPayload({
        amount,
        event: 'transfer.success',
        providerReference: response.provider_reference,
      });
      const accountBefore = await getUserAccount(withdrawUser.id, currency);

      const signature = getSignature(payload);
      const tamperedPayload = getPayload({
        amount: 20_000,
        event: 'transfer.success',
        providerReference: response.provider_reference,
      });
      const res = await handleWebhook('paystack', signature, tamperedPayload);

      expect(res).toBeDefined();
      expect(res).toBeNull();

      const accountAfter = await getUserAccount(withdrawUser.id, currency);
      expect(accountAfter.locked_balance).toBe(accountBefore.locked_balance);

      const transaction = await getAllUserTransactions({
        transactionId: response.id,
        userId: withdrawUser.id,
      });
      expect(transaction[0].status).toBe(TransactionStatus.PENDING);
      expect(transaction[0].settled_at).toBeNull();
    });
  });

  describe('transfer.failed event', () => {
    it('should refund the user account successfully with valid details', async () => {
      const amount = 10_000;
      const response = await initializeWithdraw({
        amount,
        currency,
        userId: failedWithdrawUser.id,
        bankAccountNumber: savedBankDetails.account_number,
        bankCode: savedBankDetails.bank_code,
      });
      const payload = getPayload({
        amount,
        event: 'transfer.failed',
        providerReference: response.provider_reference,
      });
      const accountBefore = await getUserAccount(
        failedWithdrawUser.id,
        currency,
      );

      const signature = getSignature(payload);
      const res = await handleWebhook('paystack', signature, payload);

      expect(res).toBeDefined();
      expect(res).toBeTruthy();

      const accountAfter = await getUserAccount(
        failedWithdrawUser.id,
        currency,
      );
      expect(Number(accountAfter.balance)).toBe(
        Number(accountBefore.balance) + amount,
      );
      expect(Number(accountAfter.locked_balance)).toBe(
        Number(accountBefore.locked_balance) - amount,
      );

      const transaction = await getAllUserTransactions({
        transactionId: response.id,
        userId: failedWithdrawUser.id,
      });
      expect(transaction[0].status).toBe(TransactionStatus.FAILED);
      expect(transaction[0].settled_at).not.toBeNull();
    });

    it('should not run successfully if the signature is wrong', async () => {
      const amount = 10_000;
      const response = await initializeWithdraw({
        amount,
        currency,
        userId: failedWithdrawUser.id,
        bankAccountNumber: savedBankDetails.account_number,
        bankCode: savedBankDetails.bank_code,
      });
      const payload = getPayload({
        amount,
        event: 'transfer.failed',
        providerReference: response.provider_reference,
      });
      const accountBefore = await getUserAccount(
        failedWithdrawUser.id,
        currency,
      );

      const signature = 'jlbhvjlhdcvhdpiocvkdoiodcjxczjbnvcjnvkjcbkvsjkn';
      const res = await handleWebhook('paystack', signature, payload);

      expect(res).toBeDefined();
      expect(res).toBeNull();

      const accountAfter = await getUserAccount(
        failedWithdrawUser.id,
        currency,
      );
      expect(accountAfter.balance).toBe(accountBefore.balance);
      expect(accountAfter.locked_balance).toBe(accountBefore.locked_balance);

      const transaction = await getAllUserTransactions({
        transactionId: response.id,
        userId: failedWithdrawUser.id,
      });
      expect(transaction[0].status).toBe(TransactionStatus.PENDING);
      expect(transaction[0].settled_at).toBeNull();
    });

    it('should not run successfully if the payload is tampered', async () => {
      const amount = 10_000;
      const response = await initializeWithdraw({
        amount,
        currency,
        userId: failedWithdrawUser.id,
        bankAccountNumber: savedBankDetails.account_number,
        bankCode: savedBankDetails.bank_code,
      });
      const payload = getPayload({
        amount,
        event: 'transfer.failed',
        providerReference: response.provider_reference,
      });
      const accountBefore = await getUserAccount(
        failedWithdrawUser.id,
        currency,
      );

      const signature = getSignature(payload);
      const tamperedPayload = getPayload({
        amount: 20_000,
        event: 'transfer.failed',
        providerReference: response.provider_reference,
      });
      const res = await handleWebhook('paystack', signature, tamperedPayload);

      expect(res).toBeDefined();
      expect(res).toBeNull();

      const accountAfter = await getUserAccount(
        failedWithdrawUser.id,
        currency,
      );
      expect(accountAfter.balance).toBe(accountBefore.balance);
      expect(accountAfter.locked_balance).toBe(accountBefore.locked_balance);

      const transaction = await getAllUserTransactions({
        transactionId: response.id,
        userId: failedWithdrawUser.id,
      });
      expect(transaction[0].status).toBe(TransactionStatus.PENDING);
      expect(transaction[0].settled_at).toBeNull();
    });
  });

  afterAll(async () => {
    await DatabaseConnection.unMigrateAll();
  });
});
