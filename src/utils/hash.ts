import * as bcrypt from 'bcryptjs';

export class HashService {
  static async hashPassword(password: string): Promise<string> {
    const randomNumber = Math.floor(Math.random() * 10) + 1;
    const salt = await bcrypt.genSalt(randomNumber);
    const hashedPassword = await bcrypt.hash(password, salt);

    return hashedPassword;
  }

  static verifyPassword(
    incomingPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(incomingPassword, hashedPassword);
  }
}
