// Generate bcrypt hash for password123 using Node.js
const bcrypt = require('bcrypt');

async function generateHash() {
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);
    console.log('\n===========================================');
    console.log('Generated bcrypt hash for "password123":');
    console.log('===========================================');
    console.log(hash);
    console.log('\nCopy this hash and use it in create_database.py');
    console.log('===========================================\n');

    // Verify it works
    const isValid = await bcrypt.compare(password, hash);
    console.log('Verification test:', isValid ? '✅ PASS' : '❌ FAIL');
}

generateHash();
