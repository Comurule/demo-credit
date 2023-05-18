import { describe, expect, it } from '@jest/globals';
import getMockUser from 'test/stubs/user';
import { DatabaseConnection } from 'src/database/connect';
import { TUser } from 'src/modules/user/user.interface';
import { signup as createAUser } from 'src/modules/user/user.service';
import { SupportedCurrency } from 'src/modules/account/interfaces/transaction.interface';
import { initializeWithdraw as withdrawFunds } from 'src/modules/account/account.service';
import { AppError } from 'src/utils/ErrorHelper';
import { changeBalance } from 'test/stubs/account';
import { savedBankDetails } from 'src/config/test.variables';

describe('Withdraw Service API', () => {
  let user: TUser;
  const currency = SupportedCurrency.NGN;

  beforeAll(async () => {
    // reset the db
    await DatabaseConnection.migrateAll();

    const userStub = getMockUser();
    user = await createAUser(userStub);
    await changeBalance(100_000_000, user.id);
  });

  it('should successfully initiate withdrawal with the right details.', async () => {
    const amount = 1000;
    const response = await withdrawFunds({
      amount,
      currency,
      userId: user.id,
      bankAccountNumber: savedBankDetails.account_number,
      bankCode: savedBankDetails.bank_code,
    });

    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
    expect(response.amount).toBe(amount);
    expect(response.currency).toBe(currency);
    expect(response.type).toBe('withdrawal');
    expect(response.status).toBe('pending');
  });

  it('should throw an error if the user details is invalid.', async () => {
    const amount = 1000;
    try {
      await withdrawFunds({
        amount,
        currency,
        userId: 'dflkflkglklgkdsf',
        bankAccountNumber: savedBankDetails.account_number,
        bankCode: savedBankDetails.bank_code,
      });
    } catch (error) {
      expect(error).toEqual(new AppError('User has no account in NGN.'));
    }
  });

  it('should throw error when a wrong detail is passed.', async () => {
    const amount = 1000;
    try {
      await withdrawFunds({
        amount,
        currency: 'USD' as any,
        userId: user.id,
        bankAccountNumber: savedBankDetails.account_number,
        bankCode: savedBankDetails.bank_code,
      });
    } catch (error) {
      expect(error).toEqual(new AppError('User has no account in USD.'));
    }
  });

  it('should throw error when amount < 100 or amount > 3,000,000.', async () => {
    try {
      await withdrawFunds({
        amount: 99,
        currency,
        userId: user.id,
        bankAccountNumber: savedBankDetails.account_number,
        bankCode: savedBankDetails.bank_code,
      });
    } catch (error) {
      expect(error).toEqual(
        new AppError('Unable to process payment. Currency not supported.'),
      );
    }

    try {
      await withdrawFunds({
        amount: 3_000_001,
        currency,
        userId: user.id,
        bankAccountNumber: savedBankDetails.account_number,
        bankCode: savedBankDetails.bank_code,
      });
    } catch (error) {
      expect(error).toEqual(
        new AppError('Unable to process payment. Currency not supported.'),
      );
    }
  });

  it('should throw error when a wrong bank detail is passed.', async () => {
    const amount = 1000;
    try {
      await withdrawFunds({
        amount,
        currency,
        userId: user.id,
        bankAccountNumber: '0940596022',
        bankCode: savedBankDetails.bank_code,
      });
    } catch (error) {
      expect(error).toEqual(
        new AppError(
          'Unable to get bank account number. Check the bank details and try again.',
        ),
      );
    }
  });

  it('should throw error when the withdraw amount is more than the user account balance.', async () => {
    const amount = 1_000_000_000;
    try {
      await withdrawFunds({
        amount,
        currency,
        userId: user.id,
        bankAccountNumber: savedBankDetails.account_number,
        bankCode: savedBankDetails.bank_code,
      });
    } catch (error) {
      expect(error).toEqual(new AppError('Account has insufficient funds.'));
    }
  });

  afterAll(async () => {
    await DatabaseConnection.unMigrateAll();
  });
});
