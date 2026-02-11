const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const {
  getStudentInternships,
  getStudentInternshipById,
  createStudentInternship,
  updateStudentInternship,
  deleteStudentInternship,
  getStatusCountsForStudent,
} = require('../models/internshipModels');

const router = express.Router();

// All routes here require an authenticated student or admin (but act on student-owned records)
router.use(authenticate);

// List internships for current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const internships = await getStudentInternships(userId);
    return res.json(internships);
  } catch (err) {
    console.error('Error in GET /student-internships:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Status counts for current user
router.get('/analytics/status-counts', async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await getStatusCountsForStudent(userId);
    return res.json(rows);
  } catch (err) {
    console.error('Error in GET /student-internships/analytics/status-counts:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single internship
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const internship = await getStudentInternshipById(userId, id);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }
    return res.json(internship);
  } catch (err) {
    console.error('Error in GET /student-internships/:id:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Create internship
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, company_name } = req.body;
    if (!title || !company_name) {
      return res.status(400).json({ message: 'Title and company_name are required' });
    }

    const created = await createStudentInternship(userId, req.body);
    return res.status(201).json(created);
  } catch (err) {
    console.error('Error in POST /student-internships:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Update internship
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const ok = await updateStudentInternship(userId, id, req.body);
    if (!ok) {
      return res.status(404).json({ message: 'Internship not found or no fields to update' });
    }
    const updated = await getStudentInternshipById(userId, id);
    return res.json(updated);
  } catch (err) {
    console.error('Error in PUT /student-internships/:id:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete internship
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const ok = await deleteStudentInternship(userId, id);
    if (!ok) {
      return res.status(404).json({ message: 'Internship not found' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /student-internships/:id:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

