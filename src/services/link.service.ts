import { randomBytes } from 'node:crypto';
import { Prisma } from '../generated/prisma/client';
import { HttpError } from '../middlewares/errors';
import * as linkRepository from '../repositories/link.repository';

const CODE_LENGTH = 7;
const MAX_ATTEMPTS = 3;
// size of the links.url column
const URL_MAX_LENGTH = 2048;

// 7 url-safe chars = 64^7 combinations; a collision is rare but possible
function generateCode() {
    return randomBytes(CODE_LENGTH).toString('base64url').slice(0, CODE_LENGTH);
}

function validateUrl(value: unknown): string {
    if (typeof value !== 'string') throw new HttpError(400, 'url is required');

    let url: URL;
    try {
        url = new URL(value);
    } catch {
        throw new HttpError(400, 'url is invalid');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new HttpError(400, 'url must be http or https');
    }
    // checked on the normalized href, which is what gets stored
    if (url.href.length > URL_MAX_LENGTH) {
        throw new HttpError(400, `url must have at most ${URL_MAX_LENGTH} characters`);
    }
    return url.href;
}

export async function shorten(value: unknown, userId: number) {
    const url = validateUrl(value);

    // the unique index on code is the real guard against collisions
    for (let attempt = 1; ; attempt++) {
        try {
            return await linkRepository.create(generateCode(), url, userId);
        } catch (error) {
            const collision = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
            if (!collision || attempt === MAX_ATTEMPTS) throw error;
        }
    }
}

export async function resolve(code: string) {
    const link = await linkRepository.findByCode(code);
    if (!link) throw new HttpError(404, 'link not found');
    await linkRepository.addClick(link.id);
    return link.url;
}

export async function stats(code: string, userId: number) {
    const link = await linkRepository.findOwnedWithClickCount(code, userId);
    if (!link) throw new HttpError(404, 'link not found');
    return { code: link.code, url: link.url, createdAt: link.createdAt, clicks: link._count.clicks };
}
