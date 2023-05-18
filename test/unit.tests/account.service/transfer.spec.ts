import { describe, expect, it } from '@jest/globals';
import getMockUser from 'test/stubs/user';
import { DatabaseConnection } from 'src/database/connect';
import { TUser } from 'src/modules/user/user.interface';
import { signup as createAUser } from 'src/modules/user/user.service';
import { SupportedCurrency } from 'src/modules/account/interfaces/transaction.interface';
import { transferFunds } from 'src/modules/account/account.service';
import { AppError } from 'src/utils/ErrorHelper';
import { changeBalance } from 'test/stubs/account';

describe('Transfer Service API', () => {
  let giver: TUser, receiver: TUser;
  const currency = SupportedCurrency.NGN;

  beforeAll(async () => {
    // reset the db
    await DatabaseConnection.migrateAll();

    const receiverStub = getMockUser();
    receiver = await createAUser(receiverStub);

    const giverStub = getMockUser();
    giver = await createAUser(giverStub);
    await changeBalance(100_000_000, giver.id);
  });

  it('should run successfully with the right details.', async () => {
    const amount = 10_000;
    const response = await transferFunds({
      amount,
      currency,
      userId: giver.id,
      receiverId: receiver.id,
    });

    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
    expect(response.amount).toBe(amount);
    expect(response.currency).toBe(currency);
    expect(response.type).toBe('transfer');
    expect(response.status).toBe('success');
  });

  it('should throw an error if the user details is invalid.', async () => {
    const amount = 10_000;
    try {
      await transferFunds({
        amount,
        currency,
        userId: 'hbkjsfdjbdnblkne',
        receiverId: receiver.id,
      });
    } catch (error) {
      expect(error).toEqual(new AppError('User has no account in NGN.'));
    }
  });

  it('should throw an error if the receiver details is invalid.', async () => {
    const amount = 10_000;
    try {
      await transferFunds({
        amount,
        currency,
        userId: giver.id,
        receiverId: 'hbkjsfdjbdnblkne',
      });
    } catch (error) {
      expect(error).toEqual(new AppError('Receiver has no account in NGN.'));
    }
  });

  it('should throw error when an unsupported currency is passed.', async () => {
    const amount = 1000;
    try {
      await transferFunds({
        amount,
        currency: 'USD' as any,
        userId: giver.id,
        receiverId: receiver.id,
      });
    } catch (error) {
      expect(error).toEqual(new AppError('User has no account in USD.'));
    }
  });

  it('should throw error when the amount is more than the user account balance.', async () => {
    const amount = 1_000_000_000;
    try {
      const response = await transferFunds({
        amount,
        currency,
        userId: giver.id,
        receiverId: receiver.id,
      });
    } catch (error) {
      expect(error).toEqual(
        new AppError('User Account has insufficient funds.'),
      );
    }
  });

  afterAll(async () => {
    await DatabaseConnection.unMigrateAll();
  });
});
