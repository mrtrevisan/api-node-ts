import mysql from 'mysql2/promise';
import { config } from '../infra/config';

// one pool per process; connections are opened on demand
export const pool = mysql.createPool({
    ...config.database,
    connectionLimit: 10,
});
