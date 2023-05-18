import { describe, expect, it } from '@jest/globals';
import getMockUser from 'test/stubs/user';
import { DatabaseConnection } from 'src/database/connect';
import { TUser } from 'src/modules/user/user.interface';
import { signup as createAUser } from 'src/modules/user/user.service';
import { SupportedCurrency } from 'src/modules/account/interfaces/transaction.interface';
import { initializeDeposit as fundUserAccount } from 'src/modules/account/account.service';
import { AppError } from 'src/utils/ErrorHelper';

describe('Deposit Service API', () => {
  let user: TUser;
  const currency = SupportedCurrency.NGN;

  beforeAll(async () => {
    // reset the db
    await DatabaseConnection.migrateAll();

    const userStub = getMockUser();
    user = await createAUser(userStub);
  });

  it('should run successfully with the right details.', async () => {
    const amount = 1000;
    const response = await fundUserAccount(currency, amount, user);

    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
    expect(response).toHaveProperty('transactionReference');
    expect(response).toHaveProperty('checkoutUrl');
  });

  it('should throw an error if the user details is invalid.', async () => {
    const amount = 1000;
    try {
      await fundUserAccount(currency, amount, {
        id: '',
        first_name: '',
        last_name: '',
        email: '',
      });
    } catch (error) {
      expect(error).toEqual(new AppError('User has no account in NGN.'));
    }
  });

  it('should throw validation error when a wrong detail is passed.', async () => {
    const amount = 1000;
    try {
      await fundUserAccount('USD' as any, amount, user);
    } catch (error) {
      expect(error).toEqual(new AppError('User has no account in USD.'));
    }
  });

  it('should throw validation error when amount < 100 or amount > 3,000,000.', async () => {
    try {
      await fundUserAccount(currency, 99, user);
    } catch (error) {
      expect(error).toEqual(
        new AppError('Unable to process payment. Currency not supported.'),
      );
    }

    try {
      await fundUserAccount(currency, 3_000_001, user);
    } catch (error) {
      expect(error).toEqual(
        new AppError('Unable to process payment. Currency not supported.'),
      );
    }
  });

  afterAll(async () => {
    await DatabaseConnection.unMigrateAll();
  });
});
