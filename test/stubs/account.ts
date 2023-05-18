import accountRepository from 'src/modules/account/repositories/account.repository';

export const changeBalance = async (
  balance: number,
  userId: string,
  currency: string = 'NGN',
) => {
  await accountRepository.update({ user_id: userId, currency }, { balance });
};
