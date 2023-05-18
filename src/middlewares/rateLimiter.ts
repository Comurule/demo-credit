import { IRequest } from 'src/interfaces/express.interface';
import { ErrorHelper } from '../utils/ErrorHelper';
import { NextFunction, Response } from 'express';

let hash: { [k: string]: number } = {};
const isWithinSameSecond = (timeInMilliseconds: number) =>
  Date.now() - timeInMilliseconds <= 1000;

export default (req: IRequest, res: Response, next: NextFunction) => {
  if (hash[req.ip] && isWithinSameSecond(hash[req.ip])) {
    return ErrorHelper.TooManyRequestException(
      'This route is limited to 1 request per second.',
    );
  }

  hash[req.ip] = Date.now();
  next();
};
