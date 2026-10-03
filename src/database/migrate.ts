import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createInterface } from 'node:readline';
import { logger as rootLogger } from '../infra/logger';
import { prisma } from './db';

const logger = rootLogger.child({ component: 'migrate' });

// Prisma has no down migrations, so there is no rollback
const commands = ['deploy', 'status'] as const;
type Command = (typeof commands)[number];

// MySQL may still be starting when the container comes up
async function waitForDatabase(attempts = 10, delayMs = 3000) {
    for (let attempt = 1; ; attempt++) {
        try {
            await prisma.$queryRaw`SELECT 1`;
            return;
        } catch (error) {
            if (attempt === attempts) throw error;
            logger.warn({ attempt, attempts, delayMs, err: error }, 'database not ready, retrying');
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
}

// Prisma Migrate is only available through the CLI; its output is relayed as JSON log lines
function runPrismaCli(args: string[]): Promise<number> {
    const cli = createRequire(import.meta.url).resolve('prisma/build/index.js');
    const child = spawn(process.execPath, [cli, ...args], {
        env: { ...process.env, CHECKPOINT_DISABLE: '1' },
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    for (const stream of [child.stdout, child.stderr]) {
        createInterface({ input: stream }).on('line', (line) => {
            if (line.trim()) logger.info({ prisma: line }, 'prisma output');
        });
    }

    return new Promise((resolve, reject) => {
        child.on('error', reject);
        child.on('close', (code) => resolve(code ?? 1));
    });
}

const command = (process.argv[2] ?? 'deploy') as Command;

if (!commands.includes(command)) {
    logger.error({ command, commands }, 'unknown command');
    process.exit(1);
}

try {
    await waitForDatabase();
    const exitCode = await runPrismaCli(['migrate', command]);
    if (exitCode === 0) {
        logger.info({ command }, 'migrate finished');
    } else {
        // `migrate status` also exits with 1 when there are pending migrations
        logger.error({ command, exitCode }, 'migrate failed');
        process.exitCode = exitCode;
    }
} catch (error) {
    logger.error({ err: error, command }, 'migrate failed');
    process.exitCode = 1;
} finally {
    await prisma.$disconnect();
}
