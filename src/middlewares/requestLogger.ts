import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import { logger } from '../infra/logger';

// one JSON line per request; the id is propagated from X-Request-Id or generated
export const requestLogger = pinoHttp({
    logger,
    genReqId: (req, res) => {
        const incoming = req.headers['x-request-id'];
        const id = typeof incoming === 'string' && incoming ? incoming : randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
    },
    // keep only what is useful to filter and correlate; full headers are noise
    serializers: {
        req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            userAgent: req.headers['user-agent'],
        }),
        res: (res) => ({ statusCode: res.statusCode }),
    },
    customLogLevel: (req, res, error) => {
        if (error || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
    },
});
