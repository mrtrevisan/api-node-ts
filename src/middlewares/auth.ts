import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../infra/config';
import { HttpError } from './errors';

export const authenticate: RequestHandler = (req, res, next) => {
    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
        throw new HttpError(401, 'token not found');
    }

    let userId: number;
    try {
        userId = Number(jwt.verify(token, config.jwtSecret).sub);
    } catch {
        throw new HttpError(403, 'invalid token');
    }
    if (!Number.isInteger(userId)) throw new HttpError(403, 'invalid token');

    // the token subject is the id of the logged-in user
    res.locals.userId = userId;

    next();
};
