const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/class', authorize(['CLASS_TEACHER']), async (req, res) => {
  try {
    const classLabel = req.user.classLabel;

    const [students] = await pool.query(
      'SELECT id, name, email FROM users WHERE role = ? AND class_label = ? AND account_status = ?',
      ['STUDENT', classLabel, 'APPROVED']
    );

    const studentIds = students.map((s) => s.id);
    if (studentIds.length === 0) {
      return res.json({ students: [], statusCounts: {} });
    }

    const [latest] = await pool.query(
      `SELECT i.*
       FROM internships i
       INNER JOIN (
         SELECT student_id, MAX(created_at) AS latest_created
         FROM internships
         WHERE student_id IN (?)
         GROUP BY student_id
       ) t ON i.student_id = t.student_id AND i.created_at = t.latest_created`,
      [studentIds]
    );

    const latestByStudent = {};
    latest.forEach((row) => {
      latestByStudent[row.student_id] = row;
    });

    const statusCounts = {};
    students.forEach((s) => {
      const internship = latestByStudent[s.id];
      const status = internship ? internship.status : 'None';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return res.json({ students, latestInternships: latestByStudent, statusCounts });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to generate class report' });
  }
});

router.get('/department', authorize(['HOD']), async (req, res) => {
  try {
    const department = req.user.department;

    const [students] = await pool.query(
      'SELECT id, name, email, class_label FROM users WHERE role = ? AND department = ? AND account_status = ?',
      ['STUDENT', department, 'APPROVED']
    );

    const studentIds = students.map((s) => s.id);
    if (studentIds.length === 0) {
      return res.json({ students: [], statusCounts: {} });
    }

    const [latest] = await pool.query(
      `SELECT i.*
       FROM internships i
       INNER JOIN (
         SELECT student_id, MAX(created_at) AS latest_created
         FROM internships
         WHERE student_id IN (?)
         GROUP BY student_id
       ) t ON i.student_id = t.student_id AND i.created_at = t.latest_created`,
      [studentIds]
    );

    const latestByStudent = {};
    latest.forEach((row) => {
      latestByStudent[row.student_id] = row;
    });

    const statusCounts = {};
    students.forEach((s) => {
      const internship = latestByStudent[s.id];
      const status = internship ? internship.status : 'None';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return res.json({ students, latestInternships: latestByStudent, statusCounts });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to generate department report' });
  }
});

router.get('/college', authorize(['PRINCIPAL']), async (req, res) => {
  try {
    const [students] = await pool.query(
      'SELECT id, name, email, department, class_label FROM users WHERE role = ? AND account_status = ?',
      ['STUDENT', 'APPROVED']
    );

    const studentIds = students.map((s) => s.id);
    if (studentIds.length === 0) {
      return res.json({ students: [], statusCounts: {} });
    }

    const [latest] = await pool.query(
      `SELECT i.*
       FROM internships i
       INNER JOIN (
         SELECT student_id, MAX(created_at) AS latest_created
         FROM internships
         WHERE student_id IN (?)
         GROUP BY student_id
       ) t ON i.student_id = t.student_id AND i.created_at = t.latest_created`,
      [studentIds]
    );

    const latestByStudent = {};
    latest.forEach((row) => {
      latestByStudent[row.student_id] = row;
    });

    const statusCounts = {};
    students.forEach((s) => {
      const internship = latestByStudent[s.id];
      const status = internship ? internship.status : 'None';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return res.json({ students, latestInternships: latestByStudent, statusCounts });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to generate college report' });
  }
});

function buildCsv(students, latestByStudent, includeDepartment = false, includeClass = true) {
  const headers = ['Student Name', 'Email'];
  if (includeDepartment) headers.push('Department');
  if (includeClass) headers.push('Class');
  headers.push('Latest Status', 'Company', 'Role');

  const lines = [headers.join(',')];
  students.forEach((s) => {
    const internship = latestByStudent[s.id];
    const status = internship ? internship.status : 'None';
    const company = internship ? internship.company_name : '';
    const role = internship ? internship.role : '';
    const row = [
      `"${s.name}"`,
      `"${s.email}"`,
      includeDepartment ? `"${s.department || ''}"` : null,
      includeClass ? `"${s.class_label || ''}"` : null,
      `"${status}"`,
      `"${company}"`,
      `"${role}"`,
    ].filter((v) => v !== null);
    lines.push(row.join(','));
  });
  return lines.join('\n');
}

router.get('/class/csv', authorize(['CLASS_TEACHER']), async (req, res) => {
  try {
    const classLabel = req.user.classLabel;
    const [students] = await pool.query(
      'SELECT id, name, email, class_label FROM users WHERE role = ? AND class_label = ? AND account_status = ?',
      ['STUDENT', classLabel, 'APPROVED']
    );
    const studentIds = students.map((s) => s.id);
    const latestByStudent = {};
    if (studentIds.length > 0) {
      const [latest] = await pool.query(
        `SELECT i.*
         FROM internships i
         INNER JOIN (
           SELECT student_id, MAX(created_at) AS latest_created
           FROM internships
           WHERE student_id IN (?)
           GROUP BY student_id
         ) t ON i.student_id = t.student_id AND i.created_at = t.latest_created`,
        [studentIds]
      );
      latest.forEach((row) => {
        latestByStudent[row.student_id] = row;
      });
    }
    const csv = buildCsv(students, latestByStudent, false, true);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="class-report.csv"');
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to generate CSV' });
  }
});

router.get('/department/csv', authorize(['HOD']), async (req, res) => {
  try {
    const department = req.user.department;
    const [students] = await pool.query(
      'SELECT id, name, email, department, class_label FROM users WHERE role = ? AND department = ? AND account_status = ?',
      ['STUDENT', department, 'APPROVED']
    );
    const studentIds = students.map((s) => s.id);
    const latestByStudent = {};
    if (studentIds.length > 0) {
      const [latest] = await pool.query(
        `SELECT i.*
         FROM internships i
         INNER JOIN (
           SELECT student_id, MAX(created_at) AS latest_created
           FROM internships
           WHERE student_id IN (?)
           GROUP BY student_id
         ) t ON i.student_id = t.student_id AND i.created_at = t.latest_created`,
        [studentIds]
      );
      latest.forEach((row) => {
        latestByStudent[row.student_id] = row;
      });
    }
    const csv = buildCsv(students, latestByStudent, false, true);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="department-report.csv"');
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to generate CSV' });
  }
});

router.get('/college/csv', authorize(['PRINCIPAL']), async (req, res) => {
  try {
    const [students] = await pool.query(
      'SELECT id, name, email, department, class_label FROM users WHERE role = ? AND account_status = ?',
      ['STUDENT', 'APPROVED']
    );
    const studentIds = students.map((s) => s.id);
    const latestByStudent = {};
    if (studentIds.length > 0) {
      const [latest] = await pool.query(
        `SELECT i.*
         FROM internships i
         INNER JOIN (
           SELECT student_id, MAX(created_at) AS latest_created
           FROM internships
           WHERE student_id IN (?)
           GROUP BY student_id
         ) t ON i.student_id = t.student_id AND i.created_at = t.latest_created`,
        [studentIds]
      );
      latest.forEach((row) => {
        latestByStudent[row.student_id] = row;
      });
    }
    const csv = buildCsv(students, latestByStudent, true, true);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="college-report.csv"');
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to generate CSV' });
  }
});

module.exports = router;

