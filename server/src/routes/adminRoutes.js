const express = require('express');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { getPool } = require('../config/db');
const { getGlobalStatusCounts } = require('../models/internshipModels');

const router = express.Router();

// All admin routes require admin role
router.use(authenticate, requireRole('admin'));

// List students (basic info)
router.get('/students', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, name, email, created_at FROM users WHERE role = ? ORDER BY created_at DESC',
      ['student']
    );
    return res.json(rows);
  } catch (err) {
    console.error('Error in GET /admin/students:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Student details + basic counts
router.get('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    const [users] = await pool.execute(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ? AND role = ?',
      [id, 'student']
    );
    const user = users[0];
    if (!user) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const [counts] = await pool.execute(
      'SELECT status, COUNT(*) as count FROM student_internships WHERE user_id = ? GROUP BY status',
      [id]
    );
    return res.json({ student: user, statusCounts: counts });
  } catch (err) {
    console.error('Error in GET /admin/students/:id:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// All internships for a student
router.get('/students/:id/internships', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM student_internships WHERE user_id = ? ORDER BY created_at DESC',
      [id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('Error in GET /admin/students/:id/internships:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Global analytics: counts per status
router.get('/analytics/status-counts', async (req, res) => {
  try {
    const rows = await getGlobalStatusCounts();
    return res.json(rows);
  } catch (err) {
    console.error('Error in GET /admin/analytics/status-counts:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

