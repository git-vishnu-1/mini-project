const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize(['SYSTEM_ADMIN']));

router.get('/students/pending', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, department, class_year, class_label, created_at FROM users WHERE role = ? AND account_status = ?',
      ['STUDENT', 'PENDING_APPROVAL']
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch pending students' });
  }
});

router.post('/students/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE users SET account_status = ? WHERE id = ?', ['APPROVED', id]);
    return res.json({ message: 'Student approved' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to approve student' });
  }
});

router.post('/students/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE users SET account_status = ? WHERE id = ?', ['REJECTED', id]);
    return res.json({ message: 'Student rejected' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reject student' });
  }
});

router.post('/staff', async (req, res) => {
  try {
    const { name, email, passwordHash, role, department, classYear, classLabel } = req.body;
    if (!['CLASS_TEACHER', 'HOD', 'PRINCIPAL', 'SYSTEM_ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, class_year, class_label, account_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'APPROVED')`,
      [name, email, passwordHash, role, department || null, classYear || null, classLabel || null]
    );
    return res.status(201).json({ message: 'Staff user created' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create staff user' });
  }
});

module.exports = router;

