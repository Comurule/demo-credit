import config from '../../knexfile';
import knex, { Knex } from 'knex';

const env = process.env.NODE_ENV || 'development';

export class DatabaseConnection {
  static connection: Knex;

  static getConnection() {
    if (!this.connection) {
      const connectionConfig = config[env];
      this.connection = knex(connectionConfig);
    }

    return this.connection;
  }

  static async migrateAll() {
    await DatabaseConnection.getConnection().migrate.latest();
  }

  static async unMigrateAll() {
    await DatabaseConnection.getConnection().migrate.rollback(undefined, true);
  }
}
