import { randomInt } from 'crypto';
import { Knex } from 'knex';
import constants from '../config/constants';

type AsyncFunction = (trx: Knex.Transaction) => Promise<any>;
export type IRepositoryOptions = {
  transaction?: Knex.Transaction;
};
export interface IRepository<T extends {}> {
  create: (props: T, option?: IRepositoryOptions) => Knex.QueryBuilder;
  findAll: (
    select?: string[],
    option?: IRepositoryOptions,
  ) => Knex.QueryBuilder;
  find: (
    filters: object,
    select?: string[],
    option?: IRepositoryOptions,
  ) => Knex.QueryBuilder;
  findById: (
    id: string,
    select?: string[],
    option?: IRepositoryOptions,
  ) => Promise<T>;
  findOne: (
    filters?: {},
    select?: string[],
    option?: IRepositoryOptions,
  ) => Promise<T>;
  update: (
    filters: object,
    props: object,
    option?: IRepositoryOptions,
  ) => Promise<T[]>;
  destroy: (
    filters?: Partial<T>,
    option?: IRepositoryOptions,
  ) => Knex.QueryBuilder;
  generateUiqueId: () => Promise<string>;
  useTransaction: (asyncFunc: AsyncFunction) => Promise<any>;
}

export const createRepository = (
  knex: Knex,
  tableName: string = 'tablename',
  selectableProps: string[] = [],
  timeout: number = 5000,
) => {
  const getTransactionalKnexObj = (o?: IRepositoryOptions, forFind = false) => {
    let db = knex(tableName);
    if (o?.transaction) {
      db = db.transacting(o.transaction);

      return forFind ? db.forUpdate() : db;
    } else {
      return db;
    }
  };

  const create = (props: object, option = {}) => {
    const db = getTransactionalKnexObj(option, false);
    return db.insert(props).timeout(timeout);
  };

  const findAll = (select = selectableProps, option = {}) => {
    const db = getTransactionalKnexObj(option, true);
    return db.select(select).timeout(timeout);
  };

  const find = (filters: object, select = selectableProps, option = {}) => {
    return findAll(select, option).where(filters);
  };

  const findOne = (filters = {}, select = selectableProps, option = {}) => {
    return find(filters, select, option).first();
  };

  const findById = (id: string, select = selectableProps, option = {}) => {
    const db = getTransactionalKnexObj(option, true);
    return db.select(select).where('id', id).timeout(timeout).first();
  };

  const update = (filters: object, props: object, option = {}) => {
    const db = getTransactionalKnexObj(option, true);
    return db
      .update(props)
      .where(filters)
      .timeout(timeout)
      .then(() => find(filters));
  };

  const destroy = (filters = {}, option = {}) => {
    const db = getTransactionalKnexObj(option, false);
    return db.del().where(filters).timeout(timeout);
  };
  const generateId = (length = constants.ID_LENGTH) => {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    let token = [];

    while (length > 0) {
      let index = randomInt(characters.length);
      token.push(characters[index]);
      length--;
    }
    return token.join('');
  };

  const generateUiqueId = async () => {
    let id: string;
    do {
      id = generateId();
    } while (await findById(id));

    return id;
  };

  const useTransaction = (asyncFunc: Function) =>
    new Promise((resolve, reject) => {
      knex
        .transaction(function (trx) {
          asyncFunc(trx).then(trx.commit).catch(trx.rollback);
        })
        .then(resolve)
        .catch(reject);
    });

  return {
    create,
    find,
    findAll,
    findById,
    findOne,
    update,
    destroy,
    generateUiqueId,
    useTransaction,
  };
};
