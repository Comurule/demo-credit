import {
  createRepository,
  IRepository,
} from '../../../database/base.repository';
import { CreateAccountDTO, TAccount } from '../interfaces/account.interface';
import { DatabaseConnection } from '../../../database/connect';
import { SupportedCurrency } from '../interfaces/transaction.interface';

const timeout = 5000;
const tableName = 'accounts';
const selectableProps = [
  'id',
  'balance',
  'locked_balance',
  'user_id',
  'channel',
  'currency',
  'updated_at',
  'created_at',
];

const db = DatabaseConnection.getConnection();
const repository: IRepository<TAccount> = createRepository(
  db,
  tableName,
  selectableProps,
);

type BeforeSaveDTO = CreateAccountDTO & {
  balance: number;
  locked_balance: number;
};
const beforeSave = (props: BeforeSaveDTO) => {
  return repository
    .generateUiqueId()
    .then((id) => ({ ...props, id }))
    .catch((err) => Promise.reject(`Error adding an id: ${err}`));
};

const create = (props: BeforeSaveDTO): Promise<TAccount> => {
  let id: string;
  return beforeSave(props)
    .then((account) => {
      id = account.id;
      return account;
    })
    .then((account) => repository.create(account))
    .then(() => repository.findById(id))
    .then((account) => account as TAccount);
};

const exists = (
  user_id: string,
  currency: string,
  channel: string = 'INTERNAL',
) => {
  return db<TAccount>(tableName)
    .where({ user_id, currency, channel })
    .timeout(timeout)
    .first()
    .then((account) => !!account);
};

type UpdateBalanceDTO = {
  amount: number;
  accountId?: string;
  userId?: string;
  currency?: SupportedCurrency;
};
const processFilter = (dto: UpdateBalanceDTO) => {
  if (!dto.accountId && (!dto.currency || !dto.userId)) {
    throw new Error('Either pass accountId or both currency and userId.');
  }
  return dto.accountId
    ? { id: dto.accountId }
    : { user_id: dto.userId, currency: dto.currency };
};
const lockAmount = (dto: UpdateBalanceDTO, option = {}) => {
  const filter = processFilter(dto);
  return repository
    .update(
      filter,
      {
        balance: db.raw(`?? - ${dto.amount}`, ['balance']),
        locked_balance: db.raw(`?? + ${dto.amount}`, ['locked_balance']),
      },
      option,
    )
    .then((account) => account[0] as TAccount);
};

const unlockAmount = (dto: UpdateBalanceDTO, option = {}) => {
  const filter = processFilter(dto);
  return repository
    .update(
      filter,
      {
        balance: db.raw(`?? + ${dto.amount}`, ['balance']),
        locked_balance: db.raw(`?? - ${dto.amount}`, ['locked_balance']),
      },
      option,
    )
    .then((account) => account[0] as TAccount);
};

const deposit = (dto: UpdateBalanceDTO, option = {}) => {
  const filter = processFilter(dto);
  return repository
    .update(
      filter,
      {
        balance: db.raw(`?? + ${dto.amount}`, ['balance']),
      },
      option,
    )
    .then((account) => account[0] as TAccount);
};

const withdraw = (dto: UpdateBalanceDTO, option = {}) => {
  const filter = processFilter(dto);
  return repository
    .update(
      filter,
      {
        locked_balance: db.raw(`?? - ${dto.amount}`, ['locked_balance']),
      },
      option,
    )
    .then((account) => account[0] as TAccount);
};

export default {
  ...repository,
  create,
  exists,
  lockAmount,
  unlockAmount,
  deposit,
  withdraw,
};
