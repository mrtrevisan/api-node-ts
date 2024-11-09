import mysql, { PoolOptions, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

function getPool()
{
    try {
        const config : PoolOptions = {
            host: process.env.DB_HOST!,
            user: process.env.DB_USER!,
            password: process.env.DB_PASS!,
            database: process.env.DB_NAME!,
            port: +process.env.DB_PORT!
        };

        const pool = mysql.createPool(config);
        return pool;
    } 
    catch (e) {
        throw e;
    }
}

async function runQuery<T extends RowDataPacket[]>(sql_query: string)
{
    try {
        const pool = getPool();

        try {
            const [rows, fields] = await pool.query<T>(sql_query);
            pool.end();

            return rows;
        } catch (e) {
            pool.end();
            throw e;
        }

    }
    catch (e) {
        throw e;
    }   
}

async function batchInsert(table: string, columns : string[], values : (string | number)[][])
{
    try {
        const pool = getPool();
        const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ?`;
        
        try {
            const [result] = await pool.query<ResultSetHeader>(sql, [values]);
            pool.end();

            return result.affectedRows;
        } catch (e) {
            pool.end();
            throw e;
        }
    } catch (e) {
        throw e;
    }
}

export { runQuery, batchInsert };
