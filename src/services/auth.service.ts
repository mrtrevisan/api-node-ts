import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import jwt from 'jsonwebtoken';
import { Prisma } from '../generated/prisma/client';
import { config } from '../infra/config';
import { HttpError } from '../middlewares/errors';
import * as userRepository from '../repositories/user.repository';

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const KEY_LENGTH = 64;

// stored as "<salt>:<hash>" in hex
async function hashPassword(password: string) {
    const salt = randomBytes(16);
    const hash = await scryptAsync(password, salt, KEY_LENGTH);
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

async function verifyPassword(password: string, stored: string) {
    const [salt, hash] = stored.split(':');
    const expected = Buffer.from(hash, 'hex');
    const actual = await scryptAsync(password, Buffer.from(salt, 'hex'), expected.length);
    return timingSafeEqual(actual, expected);
}

function validateCredentials(email: unknown, password: unknown) {
    if (typeof email !== 'string' || !email.includes('@')) throw new HttpError(400, 'email is invalid');
    if (typeof password !== 'string' || password.length < 8) {
        throw new HttpError(400, 'password must have at least 8 characters');
    }
    return { email: email.trim().toLowerCase(), password };
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

export async function login(emailInput: unknown, passwordInput: unknown) {
    const { email, password } = validateCredentials(emailInput, passwordInput);
    const user = await userRepository.findByEmail(email);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
        throw new HttpError(401, 'invalid credentials');
    }
    return jwt.sign({}, config.jwtSecret, { subject: String(user.id), expiresIn: '1h' });
}
