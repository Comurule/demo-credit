import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/index';
import getMockUser from '../../stubs/user';
import { DatabaseConnection } from '../../../src/database/connect';
import { TUser } from '../../../src/modules/user/user.interface';
import {
  signup as createAUser,
  login,
} from '../../../src/modules/user/user.service';
import { SupportedCurrency } from '../../../src/modules/account/interfaces/transaction.interface';

const depositUrl = '/api/v1/accounts/deposit';

describe('Deposit Feature', () => {
  let user: TUser, accessToken: string;
  const currency = SupportedCurrency.NGN;

  beforeAll(async () => {
    // reset the db
    await DatabaseConnection.migrateAll();

    const userStub = getMockUser();
    user = await createAUser(userStub);
    accessToken = (await login(userStub)).accessToken;
  });

  it('should run successfully with the right details.', async () => {
    const amount = 1000;

    const response = await request(app)
      .post(depositUrl)
      .send({ amount, currency })
      .set('authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Deposit link successfully created.');
  });

  it('should be protected, responds with 401 error code.', async () => {
    const amount = 1000;

    const response = await request(app).post(depositUrl).send({ amount });

    expect(response.statusCode).toBe(401);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('User not authenticated.');
  });

  it('should throw validation error when a wrong detail is passed.', async () => {
    const amount = 1500;

    const response = await request(app)
      .post(depositUrl)
      .send({ amount, currency: 'USD' })
      .set('authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body).toMatchObject({
      status: 'error',
      message: 'Validation Error(s)',
    });
  });

  it('should throw validation error when amount < 100 or amount > 3,000,000.', async () => {
    const amount = 99;

    const response = await request(app)
      .post(depositUrl)
      .send({ amount, currency })
      .set('authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body).toMatchObject({
      status: 'error',
      message: 'Validation Error(s)',
    });
  });

  afterAll(async () => {
    await DatabaseConnection.unMigrateAll();
  });
});
