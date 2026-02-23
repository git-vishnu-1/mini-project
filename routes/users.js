const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/class-students', authorize(['CLASS_TEACHER']), async (req, res) => {
  try {
    const classLabel = req.user.classLabel;
    const [rows] = await pool.query(
      'SELECT id, name, email, department, class_year, class_label FROM users WHERE role = ? AND class_label = ? AND account_status = ?',
      ['STUDENT', classLabel, 'APPROVED']
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch students' });
  }
});

router.get('/department-students', authorize(['HOD']), async (req, res) => {
  try {
    const department = req.user.department;
    const [rows] = await pool.query(
      'SELECT id, name, email, department, class_year, class_label FROM users WHERE role = ? AND department = ? AND account_status = ?',
      ['STUDENT', department, 'APPROVED']
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch students' });
  }
});

router.put('/students/:id', authorize(['CLASS_TEACHER', 'HOD']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, classYear, classLabel } = req.body;

    const [rows] = await pool.query('SELECT id, department, class_label FROM users WHERE id = ? AND role = ?', [
      id,
      'STUDENT',
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const student = rows[0];
    if (req.user.role === 'CLASS_TEACHER' && student.class_label !== req.user.classLabel) {
      return res.status(403).json({ message: 'Cannot modify students outside your class' });
    }
    if (req.user.role === 'HOD' && student.department !== req.user.department) {
      return res.status(403).json({ message: 'Cannot modify students outside your department' });
    }

    await pool.query(
      'UPDATE users SET name = ?, email = ?, department = ?, class_year = ?, class_label = ? WHERE id = ?',
      [name, email, department, classYear, classLabel, id]
    );

    return res.json({ message: 'Student updated' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update student' });
  }
});

module.exports = router;

