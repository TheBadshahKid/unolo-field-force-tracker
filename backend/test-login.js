const initSqlJs = require('sql.js');
const fs = require('fs');
const bcrypt = require('bcrypt');

async function testCredential() {
    try {
        const SQL = await initSqlJs();
        const db = new SQL.Database(fs.readFileSync('database.sqlite'));
        
        const result = db.exec('SELECT id, name, email, role, password FROM users WHERE email = "priya@unolo.com"');
        
        if (result.length === 0 || result[0].values.length === 0) {
            console.log('❌ User NOT FOUND: priya@unolo.com');
            return;
        }
        
        const user = result[0].values[0];
        console.log('✅ User found:');
        console.log('   ID:', user[0]);
        console.log('   Name:', user[1]);
        console.log('   Email:', user[2]);
        console.log('   Role:', user[3]);
        
        const storedHash = user[4];
        const isValid = await bcrypt.compare('password123', storedHash);
        
        console.log('\n🔐 Password "password123" verification:', isValid ? '✅ VALID' : '❌ INVALID');
        
        db.close();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testCredential();
