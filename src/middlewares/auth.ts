import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../infra/config';
import { HttpError } from './errors';

declare module 'express-serve-static-core' {
    interface Locals {
        // set by authenticate; only read on routes that use it
        userId: number;
    }
}

// the auth scheme is case-insensitive (RFC 9110)
const BEARER_PATTERN = /^Bearer +(\S+)$/i;

export const authenticate: RequestHandler = (req, res, next) => {
    const token = req.headers.authorization?.match(BEARER_PATTERN)?.[1];
    if (!token) {
        throw new HttpError(401, 'token not found');
    }

    // an invalid or expired token is still missing authentication: 401, not 403
    let userId: number;
    try {
        const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
        userId = typeof payload === 'string' ? NaN : Number(payload.sub);
    } catch {
        throw new HttpError(401, 'invalid token');
    }
    if (!Number.isInteger(userId)) {
        throw new HttpError(401, 'invalid token');
    }

    // the token subject is the id of the logged-in user
    res.locals.userId = userId;

    next();
};
