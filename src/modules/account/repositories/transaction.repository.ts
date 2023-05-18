import {
  createRepository,
  IRepository,
} from '../../../database/base.repository';
import { DatabaseConnection } from '../../../database/connect';
import {
  CreateTrxDTO,
  TTransaction,
} from '../interfaces/transaction.interface';

const tableName = 'transactions';
const selectableProps = [
  'id',
  'amount',
  'fee',
  'receiver_id',
  'giver_id',
  'type',
  'channel',
  'currency',
  'provider_name',
  'provider_reference',
  'provider_fee',
  'status',
  'settled_at',
  'updated_at',
  'created_at',
];

const db = DatabaseConnection.getConnection();
const repository: IRepository<TTransaction> = createRepository(
  db,
  tableName,
  selectableProps,
);

const beforeSave = (props: CreateTrxDTO) => {
  return repository
    .generateUiqueId()
    .then((id) => ({ ...props, id }))
    .catch((err) => Promise.reject(`Error adding an id: ${err}`));
};

const create = (props: CreateTrxDTO, option = {}): Promise<TTransaction> => {
  let trxn: any;
  return beforeSave(props)
    .then((trx) => (trxn = trx))
    .then((trx) => repository.create(trx, option))
    .then(() => trxn as TTransaction);
};

const findByAnyRef = ({ provider_reference, id }: Partial<TTransaction>) => {
  return db(tableName)
    .where({ provider_reference: provider_reference || null })
    .orWhere({ id: id || null })
    .select(selectableProps)
    .first()
    .then((trx) => trx);
};

const findAllAccountsTransactions = (
  userId: string,
  ids: string[] = [],
  transactionId = '',
) => {
  const select = selectableProps.map((c) => `${tableName}.${c}`);
  let sql = db(tableName)
    .select(select)
    .distinct(`${tableName}.id`)
    .innerJoin('accounts', function () {
      this.on('accounts.id', '=', `${tableName}.receiver_id`)
        .orOn('accounts.id', '=', `${tableName}.giver_id`)
        .onVal('accounts.user_id', '=', userId);
    });

  return transactionId
    ? sql.where(`${tableName}.id`, transactionId)
    : sql
        .whereIn(`${tableName}.receiver_id`, ids)
        .orWhereIn(`${tableName}.giver_id`, ids);
};

const update = (filters: object, props: object, option?: {}) => {
  return repository.update(filters, props, option).then((trxns) => trxns[0]);
};

export default {
  ...repository,
  create,
  findByAnyRef,
  findAllAccountsTransactions,
  update,
};
