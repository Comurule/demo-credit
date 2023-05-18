import jwt, { JwtPayload } from 'jsonwebtoken';
import constants from '../config/constants';

export class TokenService {
  static generateToken(user: object) {
    return jwt.sign({ user }, constants.JWT_SECRET, {
      expiresIn: constants.JWT_EXPIRESIN,
    });
  }

  static verifyToken(token: string) {
    const payload = jwt.verify(token, constants.JWT_SECRET) as JwtPayload;
    if (!payload || !payload.user) return null;
    // if (!payload.exp || payload.exp * 1000 <= Date.now()) return null;

    return payload.user;
  }
}
