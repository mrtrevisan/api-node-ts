import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';
import { config } from '../infra/config';

// the MariaDB driver adapter also speaks to MySQL; it owns the connection pool
const adapter = new PrismaMariaDb({
    ...config.database,
    connectionLimit: 10,
    // MySQL 8 caching_sha2_password over a non-TLS connection
    allowPublicKeyRetrieval: true,
});

// one client per process; connections are opened on demand
export const prisma = new PrismaClient({ adapter });
