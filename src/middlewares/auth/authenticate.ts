import { NextFunction, Request, Response } from 'express';
import { ErrorHelper } from '../../utils/ErrorHelper';
import { TokenService } from '../../utils/token';
import { IRequest } from '../../interfaces/express.interface';

const decodeToken = async (header?: string) => {
  try {
    if (!header) throw new Error();

    const tokenArray = header.split(' ');
    if (tokenArray[0] !== 'Bearer') return null;

    const token = tokenArray[1];
    if (!token) throw new Error();

    const tokenUser = await TokenService.verifyToken(token);
    if (!tokenUser) throw new Error();

    return tokenUser;
  } catch (error) {
    return null;
  }
};

export default async (req: IRequest, res: Response, next: NextFunction) => {
  try {
    req.user = await decodeToken(req.headers['authorization']);
    if (!req.user) ErrorHelper.UnauthorizedException('User not authenticated.');

    next();
  } catch (error) {
    next(error);
  }
};
