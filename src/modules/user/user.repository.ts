import { HashService } from '../../utils/hash';
import { createRepository, IRepository } from '../../database/base.repository';
import { SignupDTO, TUser } from './user.interface';
import { DatabaseConnection } from '../../database/connect';

const timeout = 5000;
const tableName = 'users';
const selectableProps = [
  'id',
  'first_name',
  'last_name',
  'email',
  'updated_at',
  'created_at',
];

const db = DatabaseConnection.getConnection();
const repository: IRepository<TUser> = createRepository(
  db,
  tableName,
  selectableProps,
);

const beforeSave = (user: SignupDTO) => {
  return HashService.hashPassword(user.password)
    .then((hash) => ({ ...user, password: hash }))
    .then((user) => Promise.all([user, repository.generateUiqueId()]))
    .then(([user, id]) => ({ ...user, id }))
    .catch((err) => Promise.reject(`Error hashing password: ${err}`));
};

const create = (props: SignupDTO): Promise<TUser> => {
  return beforeSave(props)
    .then((user) => repository.create(user))
    .then(() => repository.findOne({ email: props.email }))
    .then((user) => user as TUser);
};

const verifyUser = (email: string, password: string): Promise<TUser | null> => {
  return new Promise((resolve) => {
    db<TUser>(tableName)
      .where({ email })
      .timeout(timeout)
      .first()
      .then((user) => {
        if (!user) resolve(null);
        else return user;
      })
      .then((user) =>
        Promise.all([
          user,
          HashService.verifyPassword(password, user?.password || ''),
        ]),
      )
      .then(([user, isMatch]) => {
        if (!isMatch) return resolve(null);
        delete user?.password;
        return resolve(user || null);
      });
  });
};

const exists = (email: string) => {
  return db<TUser>(tableName)
    .where('email', 'like', `%${email}%`)
    .timeout(timeout)
    .first()
    .then((user) => !!user);
};

export default {
  ...repository,
  create,
  verifyUser,
  exists,
};
