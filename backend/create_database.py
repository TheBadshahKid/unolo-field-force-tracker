import sqlite3

# Create database
conn = sqlite3.connect('database.sqlite')
cursor = conn.cursor()

# Drop existing tables
cursor.executescript('''
    DROP TABLE IF EXISTS checkins;
    DROP TABLE IF EXISTS employee_clients;
    DROP TABLE IF EXISTS clients;
    DROP TABLE IF EXISTS users;
''')

# Create tables
cursor.executescript('''
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
''')

print("✓ Tables created")

# Use a pre-generated Node.js bcrypt hash for 'password123'
# This was generated with: bcrypt.hash('password123', 10)
# This ensures compatibility with Node.js bcrypt.compare()
password_hash = '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FGOw01OOrL8YcEZEu93h9xV87zfmPOe'

print(f"✓ Using pre-generated Node.js-compatible hash")

# Insert users
users = [
    ('Amit Sharma', 'manager@unolo.com', password_hash, 'manager', None),
    ('Rahul Kumar', 'rahul@unolo.com', password_hash, 'employee', 1),
    ('Priya Singh', 'priya@unolo.com', password_hash, 'employee', 1),
    ('Vikram Patel', 'vikram@unolo.com', password_hash, 'employee', 1),
]
cursor.executemany('INSERT INTO users (name, email, password, role, manager_id) VALUES (?, ?, ?, ?, ?)', users)
print("✓ Users created (4 users)")

# Insert clients
clients = [
    ('ABC Corp', 'Cyber City, Gurugram', 28.4946, 77.0887),
    ('XYZ Ltd', 'Sector 44, Gurugram', 28.4595, 77.0266),
    ('Tech Solutions', 'DLF Phase 3, Gurugram', 28.4947, 77.0952),
    ('Global Services', 'Udyog Vihar, Gurugram', 28.5011, 77.0838),
    ('Innovate Inc', 'Sector 18, Noida', 28.5707, 77.3219),
]
cursor.executemany('INSERT INTO clients (name, address, latitude, longitude) VALUES (?, ?, ?, ?)', clients)
print("✓ Clients created (5 clients)")

# Assign employees to clients
assignments = [
    (2, 1, '2024-01-01'),
    (2, 2, '2024-01-01'),
    (2, 3, '2024-01-15'),
    (3, 2, '2024-01-01'),
    (3, 4, '2024-01-01'),
    (4, 1, '2024-01-10'),
    (4, 5, '2024-01-10'),
]
cursor.executemany('INSERT INTO employee_clients (employee_id, client_id, assigned_date) VALUES (?, ?, ?)', assignments)
print("✓ Assignments created (7 assignments)")

# Insert sample checkins
checkins = [
    (2, 1, '2024-01-15 09:15:00', '2024-01-15 11:30:00', 28.4946, 77.0887, 'Regular visit', 'checked_out'),
    (2, 2, '2024-01-15 12:00:00', '2024-01-15 14:00:00', 28.4595, 77.0266, 'Product demo', 'checked_out'),
    (2, 3, '2024-01-15 15:00:00', '2024-01-15 17:30:00', 28.4947, 77.0952, 'Follow up meeting', 'checked_out'),
    (3, 2, '2024-01-15 09:30:00', '2024-01-15 12:00:00', 28.4595, 77.0266, 'Contract discussion', 'checked_out'),
    (3, 4, '2024-01-15 13:00:00', '2024-01-15 16:00:00', 28.5011, 77.0838, 'New requirements', 'checked_out'),
    (2, 1, '2024-01-16 09:00:00', None, 28.4950, 77.0890, 'Morning visit', 'checked_in'),
]
cursor.executemany('''
    INSERT INTO checkins (employee_id, client_id, checkin_time, checkout_time, latitude, longitude, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
''', checkins)
print("✓ Sample checkins created (6 checkins)")

conn.commit()
conn.close()

print("\n" + "="*50)
print("✅ DATABASE CREATED SUCCESSFULLY!")
print("="*50)
print("File: database.sqlite")
print("\nTest credentials:")
print("  Manager: manager@unolo.com / password123")
print("  Employee: rahul@unolo.com / password123")
print("\nPassword hash is Node.js bcrypt compatible!")
