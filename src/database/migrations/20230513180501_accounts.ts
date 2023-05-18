import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('accounts', function (table) {
    table.string('id').notNullable().primary();
    table.decimal('balance', 38, 2).unsigned().notNullable().defaultTo(0);
    table.decimal('locked_balance', 38, 2).unsigned().defaultTo(0);
    table.string('channel', 50).notNullable().defaultTo('INTERNAL');
    table.string('currency', 10).notNullable();
    table.string('user_id').notNullable();
    table.timestamps(true, true, false);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('accounts');
}
