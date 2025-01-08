import * as alt from 'alt-server';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'draingang'
};

class Database {
    static async query(sql, params = []) {
        try {
            const mysql = await import('mysql2/promise');
            const connection = await mysql.createConnection(dbConfig);
            const [results] = await connection.execute(sql, params);
            await connection.end();
            return results;
        } catch (error) {
            alt.logError('Database error:', error);
            throw error;
        }
    }
}

export const query = Database.query; 