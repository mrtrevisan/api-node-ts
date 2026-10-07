import { defineConfig } from 'prisma/config';

// builds a MySQL URL from the same DB_* variables the API uses
function databaseUrl(name: string | undefined) {
    const { DB_HOST, DB_PORT = '3306', DB_USER, DB_PASS } = process.env;
    if (!DB_HOST || !DB_USER || !DB_PASS || !name) {
        return undefined;
    }
    return `mysql://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASS)}@${DB_HOST}:${DB_PORT}/${name}`;
}

const url = databaseUrl(process.env.DB_NAME);
const shadowDatabaseUrl = databaseUrl(process.env.DB_SHADOW_NAME);

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: { path: 'prisma/migrations' },
    // `prisma generate` runs without a database, so the URL is optional here
    ...(url && { datasource: { url, ...(shadowDatabaseUrl && { shadowDatabaseUrl }) } }),
});
