const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

let SQL = null;

// Initialize sql.js
async function initSQL() {
    if (!SQL) {
        SQL = await initSqlJs();
    }
    return SQL;
}

// Get a fresh database instance from file
async function getDatabase() {
    const SqlJs = await initSQL();

    if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        const db = new SqlJs.Database(buffer);
        db.run('PRAGMA foreign_keys = ON');
        return db;
    } else {
        const db = new SqlJs.Database();
        db.run('PRAGMA foreign_keys = ON');
        return db;
    }
}

// Wrapper to mimic better-sqlite3/mysql2 API
const pool = {
    execute: async (sql, params = []) => {
        const db = await getDatabase();

        try {
            // Handle SELECT queries
            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                const stmt = db.prepare(sql);
                stmt.bind(params);

                const rows = [];
                while (stmt.step()) {
                    rows.push(stmt.getAsObject());
                }
                stmt.free();
                db.close();

                return [rows];
            }

            // Handle INSERT/UPDATE/DELETE
            db.run(sql, params);

            // Get changes info before closing
            const changesResult = db.exec('SELECT changes() as changes');
            const lastIdResult = db.exec('SELECT last_insert_rowid() as id');

            // Save changes to file
            const data = db.export();
            fs.writeFileSync(dbPath, Buffer.from(data));

            const changes = changesResult[0]?.values[0][0] || 0;
            const lastId = lastIdResult[0]?.values[0][0] || 0;

            db.close();

            return [{
                insertId: lastId,
                affectedRows: changes,
                changes: changes
            }];
        } catch (error) {
            db.close();
            console.error('Database error:', error);
            throw error;
        }
    }
};

module.exports = pool;
