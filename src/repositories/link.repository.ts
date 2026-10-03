import { prisma } from '../database/db';

export function create(code: string, url: string, userId: number) {
    return prisma.link.create({ data: { code, url, userId } });
}

export function findByCode(code: string) {
    return prisma.link.findUnique({ where: { code } });
}

// filtering by owner makes other users' links indistinguishable from missing ones
export function findOwnedWithClickCount(code: string, userId: number) {
    return prisma.link.findFirst({
        where: { code, userId },
        include: { _count: { select: { clicks: true } } },
    });
}

export function addClick(linkId: number) {
    return prisma.click.create({ data: { linkId } });
}
