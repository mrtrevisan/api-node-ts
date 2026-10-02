import type { Knex } from 'knex';
import * as createExamples from './20261002000000_create_examples';

// register new migrations here; they run in key order
const migrations: Record<string, Knex.Migration> = {
    '20261002000000_create_examples': createExamples,
};

// migrations are bundled by esbuild, so knex gets them from this list instead of reading a directory
export const migrationSource: Knex.MigrationSource<string> = {
    getMigrations: async () => Object.keys(migrations).sort(),
    getMigrationName: (name) => name,
    getMigration: async (name) => migrations[name]!,
};
