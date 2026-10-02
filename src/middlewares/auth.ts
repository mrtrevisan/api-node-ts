import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../infra/config';
import { HttpError } from './errors';

export const authenticate: RequestHandler = (req, res, next) => {
    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
        throw new HttpError(401, 'token not found');
    }

    try {
        res.locals.user = jwt.verify(token, config.jwtSecret);
    } catch {
        throw new HttpError(403, 'invalid token');
    }

    next();
};
