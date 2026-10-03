import type { ErrorRequestHandler, RequestHandler } from 'express';

export class HttpError extends Error {
    constructor(readonly status: number, message: string) {
        super(message);
        this.name = 'HttpError';
    }
}

export const notFound: RequestHandler = (req) => {
    throw new HttpError(404, `route ${req.method} ${req.path} not found`);
};

// Express 5 forwards rejected async handlers here, so routes need no try/catch
export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
    // body-parser errors (e.g. malformed JSON) carry their own 4xx status
    const status = error instanceof HttpError ? error.status
        : error?.expose && error.status < 500 ? error.status
        : 500;

    // pino-http logs res.err in the request line, keeping one log entry per request
    if (status === 500) {
        res.err = error;
    }

    const message = status === 500 ? 'internal server error' : error.message;
    res.status(status).json({ message, code: status });
};
