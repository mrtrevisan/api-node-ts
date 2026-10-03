import { logger } from './infra/logger';
import { app } from './app';
import { config } from './infra/config';
import { prisma } from './database/db';

const server = app.listen(config.port, () => {
    logger.info({ port: config.port }, 'server listening');
});

function shutdown(signal: string) {
    logger.info({ signal }, 'shutting down');
    server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
