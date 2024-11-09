import pino from 'pino';

//info, error, critical logger
export const logger = pino({
    level : 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: false,
            translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
            ignore: 'pid,hostname',
        }
    }
});