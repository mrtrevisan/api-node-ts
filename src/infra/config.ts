function required(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable ${name}`);
    }
    return value;
}

export const config = {
    port: Number(process.env.PORT ?? 3000),
    jwtSecret: required('JWT_SECRET_KEY'),
    database: {
        host: required('DB_HOST'),
        port: Number(process.env.DB_PORT ?? 3306),
        user: required('DB_USER'),
        password: required('DB_PASS'),
        database: required('DB_NAME'),
    },
};
