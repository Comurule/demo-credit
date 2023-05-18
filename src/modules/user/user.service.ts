import { ErrorHelper } from '../../utils/ErrorHelper';
import { TokenService } from '../../utils/token';
import { create as createUserAccount } from '../account/account.service';
import { SupportedCurrency } from '../account/interfaces/transaction.interface';
import { LoginDTO, SignupDTO, TUser } from './user.interface';
import userRepository from './user.repository';

export const signup = async (userData: SignupDTO): Promise<TUser> => {
  const isDuplicate = await userRepository.exists(userData.email);
  if (isDuplicate) {
    ErrorHelper.ResourceConflictException(
      `User, with email or phone number, already exists.`,
    );
  }

  const newUser: TUser = await userRepository.create({
    first_name: userData.first_name,
    last_name: userData.last_name,
    email: userData.email,
    password: userData.password,
  });

  await createUserAccount({
    currency: SupportedCurrency.NGN,
    user_id: newUser.id,
    channel: 'INTERNAL',
  });

  return newUser;
};

export const login = async ({ email, password }: LoginDTO) => {
  const validUser = (await userRepository.verifyUser(email, password)) as TUser;
  if (!validUser) {
    ErrorHelper.UnauthorizedException('Username or password is incorrect.');
  }

  return {
    accessToken: TokenService.generateToken(validUser),
    user: validUser,
  };
};

export const getAll = async () => {
  return (await userRepository.findAll()) as TUser[];
};
