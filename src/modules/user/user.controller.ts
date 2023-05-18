import { NextFunction, Request, Response } from 'express';
import * as userService from './user.service';

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const response = await userService.login(req.body);
    return res.status(200).json({
      status: 'success',
      message: 'Login Successful',
      data: response,
    });
  } catch (error) {
    return next(error);
  }
};

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const response = await userService.signup(req.body);
    return res.status(201).json({
      status: 'success',
      message: 'Signup Successful',
      data: response,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const response = await userService.getAll();
    return res.status(200).json({
      status: 'success',
      message: 'User list',
      data: response,
    });
  } catch (error) {
    return next(error);
  }
};
