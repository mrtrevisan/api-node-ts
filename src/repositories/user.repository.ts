import { prisma } from '../database/db';

export function create(email: string, passwordHash: string) {
    return prisma.user.create({ data: { email, passwordHash } });
}

export function findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
}
