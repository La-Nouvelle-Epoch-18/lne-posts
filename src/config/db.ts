import { PoolConfig } from "pg";

export const DB_CFG: PoolConfig = {
    user: process.env.DATABASE_USER || 'lne_user',
    database: process.env.DATABASE_NAME || 'lne',
    password: process.env.DATABASE_PASSWD || '123456',
    host: process.env.DATABASE_HOST || 'localhost',
    port: 5432,
    max: 60,
    idleTimeoutMillis: 3000,
    connectionTimeoutMillis: 3000
};