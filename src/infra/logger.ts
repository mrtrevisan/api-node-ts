import pino from 'pino';

// reads the env directly (not infra/config) so configuration errors can also be logged as JSON
export const logger = pino({
    level: process.env.LOG_LEVEL ?? 'info',
    base: { service: process.env.SERVICE_NAME ?? 'myurl' },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
        level: (label) => ({ level: label }),
    },
    redact: ['req.headers.authorization', 'req.headers.cookie'],
});

// last resort: log fatal errors as JSON before the process dies
process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'uncaught exception');
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'unhandled rejection');
    process.exit(1);
});
