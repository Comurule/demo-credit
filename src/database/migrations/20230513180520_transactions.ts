import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('transactions', function (table) {
    table.string('id', 50).notNullable().primary();
    table.decimal('amount').notNullable().defaultTo(0);
    table.decimal('fee').notNullable().defaultTo(0);
    table.string('channel', 50).notNullable().defaultTo('INTERNAL');
    table.string('currency', 10).notNullable();
    table.string('receiver_id').notNullable();
    table.string('giver_id').notNullable();
    table.string('type', 50).notNullable();
    table.string('provider_name', 50).notNullable();
    table.string('provider_reference', 50);
    table.decimal('provider_fee').notNullable().defaultTo(0);
    table.string('status', 50).notNullable();
    table.dateTime('settled_at', { useTz: true });
    table.timestamps(true, true, false);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('transactions');
}
