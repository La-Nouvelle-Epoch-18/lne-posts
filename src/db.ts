import { Pool } from 'pg';

import { DB_CFG } from './config/db';

const pool: Pool = new Pool(DB_CFG);

pool.on('error', (err, client) =>
{
    console.log("Database pool error", err);
});

export function query<T = any, I extends any[] = any[]>(q: string, v?: I)
{
    return pool.query<T, I>(q, v);
}
