const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const initSqlJs = require('sql.js');

async function createDatabase() {
    console.log('Starting database creation...\n');

    // Initialize SQL.js
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    // Create tables
    console.log('Creating tables...');
    db.run(`
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'employee' CHECK(role IN ('employee', 'manager')),
            manager_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    db.run(`
        CREATE TABLE clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT,
            latitude REAL,
            longitude REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    db.run(`
        CREATE TABLE employee_clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            client_id INTEGER NOT NULL,
            assigned_date DATE NOT NULL,
            FOREIGN KEY (employee_id) REFERENCES users(id),
            FOREIGN KEY (client_id) REFERENCES clients(id)
        );
    `);

    db.run(`
        CREATE TABLE checkins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            client_id INTEGER NOT NULL,
            checkin_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            checkout_time DATETIME,
            latitude REAL,
            longitude REAL,
            distance_from_client REAL,
            notes TEXT,
            status TEXT DEFAULT 'checked_in' CHECK(status IN ('checked_in', 'checked_out'))
        );
    `);

    db.run('CREATE INDEX idx_checkins_employee ON checkins(employee_id)');
    db.run('CREATE INDEX idx_checkins_date ON checkins(checkin_time)');
    db.run('CREATE INDEX idx_employee_clients ON employee_clients(employee_id, client_id)');

    console.log('✓ Tables created');

    // Generate password hash with Node.js bcrypt
    console.log('\nGenerating password hash...');
    const passwordHash = await bcrypt.hash('password123', 10);
    console.log('✓ Password hash generated:', passwordHash.substring(0, 30) + '...');

    // Test the hash
    const testVerify = await bcrypt.compare('password123', passwordHash);
    console.log('✓ Hash verification test:', testVerify ? 'PASS ✅' : 'FAIL ❌');

    // Insert users
    console.log('\nInserting users...');
    db.run('INSERT INTO users (name, email, password, role, manager_id) VALUES (?, ?, ?, ?, ?)',
        ['Amit Sharma', 'manager@unolo.com', passwordHash, 'manager', null]);
    db.run('INSERT INTO users (name, email, password, role, manager_id) VALUES (?, ?, ?, ?, ?)',
        ['Rahul Kumar', 'rahul@unolo.com', passwordHash, 'employee', 1]);
    db.run('INSERT INTO users (name, email, password, role, manager_id) VALUES (?, ?, ?, ?, ?)',
        ['Priya Singh', 'priya@unolo.com', passwordHash, 'employee', 1]);
    db.run('INSERT INTO users (name, email, password, role, manager_id) VALUES (?, ?, ?, ?, ?)',
        ['Vikram Patel', 'vikram@unolo.com', passwordHash, 'employee', 1]);
    console.log('✓ 4 users created');

    // Insert clients
    console.log('\nInserting clients...');
    db.run('INSERT INTO clients (name, address, latitude, longitude) VALUES (?, ?, ?, ?)',
        ['ABC Corp', 'Cyber City, Gurugram', 28.4946, 77.0887]);
    db.run('INSERT INTO clients (name, address, latitude, longitude) VALUES (?, ?, ?, ?)',
        ['XYZ Ltd', 'Sector 44, Gurugram', 28.4595, 77.0266]);
    db.run('INSERT INTO clients (name, address, latitude, longitude) VALUES (?, ?, ?, ?)',
        ['Tech Solutions', 'DLF Phase 3, Gurugram', 28.4947, 77.0952]);
    db.run('INSERT INTO clients (name, address, latitude, longitude) VALUES (?, ?, ?, ?)',
        ['Global Services', 'Udyog Vihar, Gurugram', 28.5011, 77.0838]);
    db.run('INSERT INTO clients (name, address, latitude, longitude) VALUES (?, ?, ?, ?)',
        ['Innovate Inc', 'Sector 18, Noida', 28.5707, 77.3219]);
    console.log('✓ 5 clients created');

    // Insert assignments
    console.log('\nInserting employee-client assignments...');
    db.run('INSERT INTO employee_clients (employee_id, client_id, assigned_date) VALUES (?, ?, ?)', [2, 1, '2024-01-01']);
    db.run('INSERT INTO employee_clients (employee_id, client_id, assigned_date) VALUES (?, ?, ?)', [2, 2, '2024-01-01']);
    db.run('INSERT INTO employee_clients (employee_id, client_id, assigned_date) VALUES (?, ?, ?)', [2, 3, '2024-01-15']);
    db.run('INSERT INTO employee_clients (employee_id, client_id, assigned_date) VALUES (?, ?, ?)', [3, 2, '2024-01-01']);
    db.run('INSERT INTO employee_clients (employee_id, client_id, assigned_date) VALUES (?, ?, ?)', [3, 4, '2024-01-01']);
    db.run('INSERT INTO employee_clients (employee_id, client_id, assigned_date) VALUES (?, ?, ?)', [4, 1, '2024-01-10']);
    db.run('INSERT INTO employee_clients (employee_id, client_id, assigned_date) VALUES (?, ?, ?)', [4, 5, '2024-01-10']);
    console.log('✓ 7 assignments created');

    // Insert sample checkins
    console.log('\nInserting sample checkins...');
    db.run('INSERT INTO checkins (employee_id, client_id, checkin_time, checkout_time, latitude, longitude, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [2, 1, '2024-01-15 09:15:00', '2024-01-15 11:30:00', 28.4946, 77.0887, 'Regular visit', 'checked_out']);
    db.run('INSERT INTO checkins (employee_id, client_id, checkin_time, checkout_time, latitude, longitude, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [2, 2, '2024-01-15 12:00:00', '2024-01-15 14:00:00', 28.4595, 77.0266, 'Product demo', 'checked_out']);
    db.run('INSERT INTO checkins (employee_id, client_id, checkin_time, checkout_time, latitude, longitude, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [2, 3, '2024-01-15 15:00:00', '2024-01-15 17:30:00', 28.4947, 77.0952, 'Follow up meeting', 'checked_out']);
    db.run('INSERT INTO checkins (employee_id, client_id, checkin_time, checkout_time, latitude, longitude, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [3, 2, '2024-01-15 09:30:00', '2024-01-15 12:00:00', 28.4595, 77.0266, 'Contract discussion', 'checked_out']);
    db.run('INSERT INTO checkins (employee_id, client_id, checkin_time, checkout_time, latitude, longitude, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [3, 4, '2024-01-15 13:00:00', '2024-01-15 16:00:00', 28.5011, 77.0838, 'New requirements', 'checked_out']);
    db.run('INSERT INTO checkins (employee_id, client_id, checkin_time, checkout_time, latitude, longitude, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [2, 1, '2024-01-16 09:00:00', null, 28.4950, 77.0890, 'Morning visit', 'checked_in']);
    console.log('✓ 6 sample checkins created');

    // Save database to file
    const dbPath = path.join(__dirname, 'database.sqlite');
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));

    db.close();

    console.log('\n' + '='.repeat(60));
    console.log('✅ DATABASE CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('File: database.sqlite');
    console.log('\nTest credentials:');
    console.log('  Manager: manager@unolo.com / password123');
    console.log('  Employee: rahul@unolo.com / password123');
    console.log('\nPassword hash verified with Node.js bcrypt!');
    console.log('='.repeat(60));
}

createDatabase().catch(console.error);
