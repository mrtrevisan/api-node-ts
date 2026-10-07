import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import jwt from 'jsonwebtoken';
import { Prisma } from '../generated/prisma/client';
import { config } from '../infra/config';
import { HttpError } from '../middlewares/errors';
import * as userRepository from '../repositories/user.repository';

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const KEY_LENGTH = 64;
const PASSWORD_MIN_LENGTH = 8;

// WHATWG `input type=email` rule, but the domain must have a TLD (rejects `user@localhost`)
const EMAIL_PATTERN =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
// RFC 5321 path limit
const EMAIL_MAX_LENGTH = 254;

// stored as "<salt>:<hash>" in hex
async function hashPassword(password: string) {
    const salt = randomBytes(16);
    const hash = await scryptAsync(password, salt, KEY_LENGTH);
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

async function verifyPassword(password: string, stored: string) {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) {
        return false;
    }
    const expected = Buffer.from(hash, 'hex');
    const actual = await scryptAsync(password, Buffer.from(salt, 'hex'), expected.length);
    return timingSafeEqual(actual, expected);
}

// verified against when the email is unknown, so both cases take the same time
const DUMMY_HASH = await hashPassword(randomBytes(16).toString('hex'));

function normalizeEmail(value: unknown) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function validateCredentials(emailInput: unknown, password: unknown) {
    const email = normalizeEmail(emailInput);
    if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
        throw new HttpError(400, 'email is invalid');
    }
    if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
        throw new HttpError(400, `password must have at least ${PASSWORD_MIN_LENGTH} characters`);
    }
    return { email, password };
}

export async function register(emailInput: unknown, passwordInput: unknown) {
    const { email, password } = validateCredentials(emailInput, passwordInput);
    try {
        return await userRepository.create(email, await hashPassword(password));
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new HttpError(409, 'email already registered');
        }
        throw error;
    }
}

// login doesn't apply the registration rules: any wrong input is just invalid credentials
export async function login(emailInput: unknown, password: unknown) {
    const email = normalizeEmail(emailInput);
    if (!email || typeof password !== 'string') {
        throw new HttpError(401, 'invalid credentials');
    }

    const user = await userRepository.findByEmail(email);
    const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) {
        throw new HttpError(401, 'invalid credentials');
    }

    return jwt.sign({}, config.jwtSecret, { algorithm: 'HS256', subject: String(user.id), expiresIn: '1h' });
}
