import type { ErrorRequestHandler, RequestHandler } from 'express';

export class HttpError extends Error {
    constructor(
        readonly status: number,
        message: string,
    ) {
        super(message);
        this.name = 'HttpError';
    }
}

export const notFound: RequestHandler = (req) => {
    throw new HttpError(404, `route ${req.method} ${req.path} not found`);
};

function statusOf(error: unknown): number {
    if (error instanceof HttpError) {
        return error.status;
    }
    // body-parser errors (e.g. malformed JSON) carry their own 4xx status
    const { expose, status } = (error ?? {}) as { expose?: unknown; status?: unknown };
    if (expose && typeof status === 'number' && status < 500) {
        return status;
    }
    return 500;
}

// Express 5 forwards rejected async handlers here, so routes need no try/catch
export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, next) => {
    // a response already being streamed can't be replaced; Express closes the connection
    if (res.headersSent) {
        return next(error);
    }

    const status = statusOf(error);

    // pino-http logs res.err in the request line, keeping one log entry per request
    if (status === 500) {
        res.err = error instanceof Error ? error : new Error(String(error));
    }

    const message = status !== 500 && error instanceof Error ? error.message : 'internal server error';
    res.status(status).json({ message, code: status });
};
