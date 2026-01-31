const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const initSqlJs = require('sql.js');

async function updatePasswords() {
    console.log('Updating passwords in database...\n');

    const dbPath = path.join(__dirname, 'database.sqlite');

    // Delete old database and create fresh one
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log('✓ Deleted old database.sqlite');
    }

    // Now run the full init script
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    // Create all tables
    db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'employee' CHECK(role IN ('employee', 'manager')),
        manager_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        latitude REAL,
        longitude REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE employee_clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        client_id INTEGER NOT NULL,
        assigned_date DATE NOT NULL,
        FOREIGN KEY (employee_id) REFERENCES users(id),
        FOREIGN KEY (client_id) REFERENCES clients(id)
    )`);

    db.run(`CREATE TABLE checkins (
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
    )`);

    db.run('CREATE INDEX idx_checkins_employee ON checkins(employee_id)');
    db.run('CREATE INDEX idx_checkins_date ON checkins(checkin_time)');
    db.run('CREATE INDEX idx_employee_clients ON employee_clients(employee_id, client_id)');

    console.log('✓ Tables created\n');

    // Generate NEW hash
    const hash = await bcrypt.hash('password123', 10);
    console.log('Generated hash:', hash);

    // VERIFY the hash works
    const testResult = await bcrypt.compare('password123', hash);
    console.log('Hash verification:', testResult ? '✅ WORKS' : '❌ FAILED');

    if (!testResult) {
        console.error('\n❌ HASH GENERATION FAILED!');
        process.exit(1);
    }

    // Insert users with NEW hash
    db.run('INSERT INTO users (name, email, password, role, manager_id) VALUES (?, ?, ?, ?, ?)',
        ['Amit Sharma', 'manager@unolo.com', hash, 'manager', null]);
    db.run('INSERT INTO users (name, email, password, role, manager_id) VALUES (?, ?, ?, ?, ?)',
        ['Rahul Kumar', 'rahul@unolo.com', hash, 'employee', 1]);
    db.run('INSERT INTO users (name, email, password, role, manager_id) VALUES (?, ?, ?, ?, ?)',
        ['Priya Singh', 'priya@unolo.com', hash, 'employee', 1]);
    db.run('INSERT INTO users (name, email, password, role, manager_id) VALUES (?, ?, ?, ?, ?)',
        ['Vikram Patel', 'vikram@unolo.com', hash, 'employee', 1]);

    // Insert clients
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

    // Assignments
    db.run('INSERT INTO employee_clients VALUES (1, 2, 1, "2024-01-01")');
    db.run('INSERT INTO employee_clients VALUES (2, 2, 2, "2024-01-01")');
    db.run('INSERT INTO employee_clients VALUES (3, 2, 3, "2024-01-15")');
    db.run('INSERT INTO employee_clients VALUES (4, 3, 2, "2024-01-01")');
    db.run('INSERT INTO employee_clients VALUES (5, 3, 4, "2024-01-01")');
    db.run('INSERT INTO employee_clients VALUES (6, 4, 1, "2024-01-10")');
    db.run('INSERT INTO employee_clients VALUES (7, 4, 5, "2024-01-10")');

    // Checkins
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

    console.log('✓ All data inserted\n');

    // Save to file
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));

    console.log('✓ Database saved to:', dbPath);

    // Verify it was written
    const fileExists = fs.existsSync(dbPath);
    const fileSize = fileExists ? fs.statSync(dbPath).size : 0;
    console.log('✓ File exists:', fileExists);
    console.log('✓ File size:', fileSize, 'bytes');

    db.close();

    console.log('\n' + '='.repeat(50));
    console.log('✅ DATABASE CREATED AND VERIFIED!');
    console.log('='.repeat(50));
    console.log('\nNow restart the backend server:');
    console.log('  1. Stop server (Ctrl+C)');
    console.log('  2. npm run dev');
    console.log('  3. Login with: manager@unolo.com / password123');
    console.log('='.repeat(50));
}

updatePasswords().catch(err => {
    console.error('\n❌ ERROR:', err);
    process.exit(1);
});
