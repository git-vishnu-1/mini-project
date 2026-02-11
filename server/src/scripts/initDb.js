const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const { getPool } = require('../config/db');

dotenv.config();

async function run() {
  const pool = getPool();
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    // Split on semicolons to execute statements safely
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      // eslint-disable-next-line no-await-in-loop
      await pool.query(stmt);
    }

    console.log('Database schema applied successfully.');

    // Seed default admin if not exists
    const adminEmail = 'admin@example.com';
    const adminPassword = 'Admin@123'; // You can change this after first login

    const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [adminEmail]);
    if (rows.length === 0) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await pool.execute(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['Default Admin', adminEmail, passwordHash, 'admin']
      );
      console.log(`Seeded default admin user: ${adminEmail} / ${adminPassword}`);
    } else {
      console.log('Admin user already exists, skipping seeding.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

run();

