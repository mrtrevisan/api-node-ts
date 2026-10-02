import knex from 'knex';
import { logger as rootLogger } from '../infra/logger';
import { migrationSource } from './migrations';
import { config } from '../infra/config';

const logger = rootLogger.child({ component: 'migrate' });

const commands = ['latest', 'rollback', 'status'] as const;
type Command = (typeof commands)[number];

const db = knex({
    client: 'mysql2',
    connection: config.database,
    migrations: { migrationSource },
    log: {
        warn: (message) => logger.warn({ knex: message }, 'knex warning'),
        error: (message) => logger.error({ knex: message }, 'knex error'),
        deprecate: (method, alternative) => logger.warn({ method, alternative }, 'knex deprecation'),
        debug: (message) => logger.debug({ knex: message }, 'knex debug'),
    },
});

// MySQL may still be starting when the container comes up
async function waitForDatabase(attempts = 10, delayMs = 3000) {
    for (let attempt = 1; ; attempt++) {
        try {
            await db.raw('SELECT 1');
            return;
        } catch (error) {
            if (attempt === attempts) throw error;
            logger.warn({ attempt, attempts, delayMs, err: error }, 'database not ready, retrying');
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
}

async function run(command: Command) {
    await waitForDatabase();

    if (command === 'latest') {
        const [batch, applied] = await db.migrate.latest();
        logger.info({ batch, migrations: applied }, applied.length ? 'migrations applied' : 'already up to date');
    } else if (command === 'rollback') {
        const [batch, reverted] = await db.migrate.rollback();
        logger.info({ batch, migrations: reverted }, reverted.length ? 'migrations rolled back' : 'nothing to roll back');
    } else {
        const [completed, pending] = await db.migrate.list();
        logger.info({
            completed: completed.map((m: { name: string }) => m.name),
            pending,
        }, 'migration status');
    }
}

const command = (process.argv[2] ?? 'latest') as Command;

if (!commands.includes(command)) {
    logger.error({ command, commands }, 'unknown command');
    process.exit(1);
}

try {
    await run(command);
} catch (error) {
    logger.error({ err: error, command }, 'migration failed');
    process.exitCode = 1;
} finally {
    await db.destroy();
}
