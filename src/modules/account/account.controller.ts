import { NextFunction, Request, Response } from 'express';
import * as accountService from './account.service';
import { ErrorHelper } from '../../utils/ErrorHelper';
import { IRequest } from '../../interfaces/express.interface';

const extractSignature = (headers: any, providerName: string) => {
  switch (providerName) {
    case 'paystack':
      return headers['x-paystack-signature'];
      break;

    default:
      throw new Error(`Unrecognized provider: ${providerName}.`);
  }
};

export const createUserAccount = async (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user)
      return ErrorHelper.UnauthorizedException('Unauthorized user.');

    const response = await accountService.create({
      user_id: req.user?.id,
      currency: req.body.currency,
      channel: req.body.channel,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Account record successfully created.',
      data: response,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllUserAccount = async (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user)
      return ErrorHelper.UnauthorizedException('Unauthorized user.');

    const currency = req.query?.currency;
    const userId = req.user.id;
    const response = currency
      ? await accountService.getUserAccount(userId, req.body.currency)
      : await accountService.getAllUserAccounts(userId);

    return res.status(200).json({
      status: 'success',
      message: 'Account record list.',
      data: response,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllUserTransactions = async (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user)
      return ErrorHelper.UnauthorizedException('Unauthorized user.');

    const response = await accountService.getAllUserTransactions({
      ...req.query,
      userId: req.user.id,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Account Transaction list.',
      data: response,
    });
  } catch (error) {
    return next(error);
  }
};

export const intializeDeposit = async (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user)
      return ErrorHelper.UnauthorizedException('Unauthorized user.');
    const { currency, amount } = req.body;
    const response = await accountService.initializeDeposit(
      currency,
      amount,
      req.user,
    );
    return res.status(200).json({
      status: 'success',
      message: 'Deposit link successfully created.',
      data: response,
    });
  } catch (error) {
    return next(error);
  }
};

export const intializeWithdrawal = async (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user)
      return ErrorHelper.UnauthorizedException('Unauthorized user.');
    const { amount, currency, bankAccountNumber, bankCode } = req.body;
    const response = await accountService.initializeWithdraw({
      userId: req.user.id,
      amount,
      currency,
      bankAccountNumber,
      bankCode,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Withdraw transaction successfully initiated.',
      data: response,
    });
  } catch (error) {
    return next(error);
  }
};

export const transfer = async (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user)
      return ErrorHelper.UnauthorizedException('Unauthorized user.');
    const { amount, currency, receiverId } = req.body;
    const response = await accountService.transferFunds({
      userId: req.user.id,
      amount,
      currency,
      receiverId,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Transfer transaction successfully done.',
      data: response,
    });
  } catch (error) {
    return next(error);
  }
};

export const webhookHandler = async (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const signature = extractSignature(req.headers, req.params.provider);
    const response = await accountService.handleWebhook(
      req.params.provider,
      signature,
      req.body,
    );

    return res.status(200).json({
      status: 'success',
      message: 'Webhook handled successfully.',
      data: response,
    });
  } catch (error) {
    return next(error);
  }
};
