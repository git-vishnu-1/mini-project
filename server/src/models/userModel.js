const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

async function createUser({ name, email, password, role = 'student' }) {
  const pool = getPool();
  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, role]
  );
  return { id: result.insertId, name, email, role };
}

async function findUserByEmail(email) {
  const pool = getPool();
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findUserById(id) {
  const pool = getPool();
  const [rows] = await pool.execute('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?', [
    id,
  ]);
  return rows[0] || null;
}

async function validatePassword(user, password) {
  return bcrypt.compare(password, user.password_hash);
}

function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  validatePassword,
  generateToken,
};

