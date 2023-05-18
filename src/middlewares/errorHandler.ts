import { NextFunction, Request, Response } from 'express';
import { InternalServerError, AppError } from '../utils/ErrorHelper';
import logger from '../utils/logger';

export default (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  let serverError;
  if (process.env.NODE_ENV === 'production') {
    logger.error(err);
    serverError = new InternalServerError(
      'Something went wrong. Try again later.',
    );
  } else {
    console.log(err);
    serverError = new InternalServerError(err.message, err.stack);
  }

  res
    .status(serverError.statusCode)
    .json(serverError.toJSON(process.env.NODE_ENV));
  // return process.exit(0);
};
