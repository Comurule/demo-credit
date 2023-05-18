import { Request } from 'express';
import { TUser } from '../modules/user/user.interface';

export interface IRequest extends Request {
  user?: TUser;
}
