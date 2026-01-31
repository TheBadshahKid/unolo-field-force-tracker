// Simple database initialization script with better error handling
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

try {
    const dbPath = path.join(__dirname, '..', 'database.sqlite');

    // Delete existing database
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log('✓ Deleted existing database');
    }

    console.log('Creating new database at:', dbPath);
    const db = new Database(dbPath, { verbose: console.log });

    // Create tables
    console.log('\n Creating tables...');
    db.exec(`
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

        CREATE TABLE clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT,
            latitude REAL,
            longitude REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE employee_clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            client_id INTEGER NOT NULL,
            assigned_date DATE NOT NULL,
            FOREIGN KEY (employee_id) REFERENCES users(id),
            FOREIGN KEY (client_id) REFERENCES clients(id)
        );

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

        CREATE INDEX idx_checkins_employee ON checkins(employee_id);
        CREATE INDEX idx_checkins_date ON checkins(checkin_time);
        CREATE INDEX idx_employee_clients ON employee_clients(employee_id, client_id);
    `);
    console.log('✓ Tables created');

    // Hash password
    console.log('\n🔐 Hashing passwords...');
    const hashedPassword = bcrypt.hashSync('password123', 10);
    console.log('✓ Password hashed');

    // Insert users
    console.log('\n👤 Creating users...');
    const insertUser = db.prepare('INSERT INTO users (name, email, password, role, manager_id) VALUES (?, ?, ?, ?, ?)');

    insertUser.run('Amit Sharma', 'manager@unolo.com', hashedPassword, 'manager', null);
    insertUser.run('Rahul Kumar', 'rahul@unolo.com', hashedPassword, 'employee', 1);
    insertUser.run('Priya Singh', 'priya@unolo.com', hashedPassword, 'employee', 1);
    insertUser.run('Vikram Patel', 'vikram@unolo.com', hashedPassword, 'employee', 1);
    console.log('✓ Users created (4 users)');

    // Insert clients
    console.log('\n🏢 Creating clients...');
    const insertClient = db.prepare('INSERT INTO clients (name, address, latitude, longitude) VALUES (?, ?, ?, ?)');

    insertClient.run('ABC Corp', 'Cyber City, Gurugram', 28.4946, 77.0887);
    insertClient.run('XYZ Ltd', 'Sector 44, Gurugram', 28.4595, 77.0266);
    insertClient.run('Tech Solutions', 'DLF Phase 3, Gurugram', 28.4947, 77.0952);
    insertClient.run('Global Services', 'Udyog Vihar, Gurugram', 28.5011, 77.0838);
    insertClient.run('Innovate Inc', 'Sector 18, Noida', 28.5707, 77.3219);
    console.log('✓ Clients created (5 clients)');

    // Assign employees to clients
    console.log('\n📋 Creating assignments...');
    const insertAssignment = db.prepare('INSERT INTO employee_clients (employee_id, client_id, assigned_date) VALUES (?, ?, ?)');

    insertAssignment.run(2, 1, '2024-01-01');
    insertAssignment.run(2, 2, '2024-01-01');
    insertAssignment.run(2, 3, '2024-01-15');
    insertAssignment.run(3, 2, '2024-01-01');
    insertAssignment.run(3, 4, '2024-01-01');
    insertAssignment.run(4, 1, '2024-01-10');
    insertAssignment.run(4, 5, '2024-01-10');
    console.log('✓ Assignments created (7 assignments)');

    // Insert sample checkins
    console.log('\n✅ Creating sample checkins...');
    const insertCheckin = db.prepare(`
        INSERT INTO checkins (employee_id, client_id, checkin_time, checkout_time, latitude, longitude, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCheckin.run(2, 1, '2024-01-15 09:15:00', '2024-01-15 11:30:00', 28.4946, 77.0887, 'Regular visit', 'checked_out');
    insertCheckin.run(2, 2, '2024-01-15 12:00:00', '2024-01-15 14:00:00', 28.4595, 77.0266, 'Product demo', 'checked_out');
    insertCheckin.run(2, 3, '2024-01-15 15:00:00', '2024-01-15 17:30:00', 28.4947, 77.0952, 'Follow up meeting', 'checked_out');
    insertCheckin.run(3, 2, '2024-01-15 09:30:00', '2024-01-15 12:00:00', 28.4595, 77.0266, 'Contract discussion', 'checked_out');
    insertCheckin.run(3, 4, '2024-01-15 13:00:00', '2024-01-15 16:00:00', 28.5011, 77.0838, 'New requirements', 'checked_out');
    insertCheckin.run(2, 1, '2024-01-16 09:00:00', null, 28.4950, 77.0890, 'Morning visit', 'checked_in');
    console.log('✓ Sample checkins created (6 checkins)');

    db.close();

    console.log('\n');
    console.log('========================================');
    console.log('✅ DATABASE INITIALIZED SUCCESSFULLY!');
    console.log('========================================');
    console.log(`Database file: ${dbPath}`);
    console.log('\nTest credentials:');
    console.log('  Manager: manager@unolo.com / password123');
    console.log('  Employee: rahul@unolo.com / password123');
    console.log('');

} catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
}
