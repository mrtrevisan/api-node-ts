import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../database/db';

export interface Example {
    id: number;
    name: string;
}

export async function findAll(): Promise<Example[]> {
    const [rows] = await pool.execute<(Example & RowDataPacket)[]>('SELECT id, name FROM examples');
    return rows.map(({ id, name }) => ({ id, name }));
}
