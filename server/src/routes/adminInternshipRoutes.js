const express = require('express');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  getAdminInternships,
  getAdminInternshipById,
  createAdminInternship,
  updateAdminInternship,
  deleteAdminInternship,
  createStudentInternship,
} = require('../models/internshipModels');

const router = express.Router();

// Public for authenticated students/admins to browse
router.use(authenticate);

// List admin internships
router.get('/', async (req, res) => {
  try {
    const rows = await getAdminInternships();
    return res.json(rows);
  } catch (err) {
    console.error('Error in GET /admin-internships:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get one admin internship
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const internship = await getAdminInternshipById(id);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }
    return res.json(internship);
  } catch (err) {
    console.error('Error in GET /admin-internships/:id:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Student: add admin internship to personal tracker
router.post('/:id/add-to-tracker', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const adminInternship = await getAdminInternshipById(id);
    if (!adminInternship) {
      return res.status(404).json({ message: 'Admin internship not found' });
    }

    const studentData = {
      admin_internship_id: adminInternship.id,
      title: adminInternship.title,
      company_name: adminInternship.company_name,
      location: adminInternship.location,
      job_type: adminInternship.job_type,
      job_link: adminInternship.job_link,
      description: adminInternship.description,
      status: 'Pending',
      application_deadline: adminInternship.application_deadline,
      offer_deadline: adminInternship.offer_deadline,
      contact_name: adminInternship.contact_name,
      contact_email: adminInternship.contact_email,
      contact_phone: adminInternship.contact_phone,
      contact_linkedin: adminInternship.contact_linkedin,
      reminder_enabled: 1,
    };

    const created = await createStudentInternship(userId, studentData);
    return res.status(201).json(created);
  } catch (err) {
    console.error('Error in POST /admin-internships/:id/add-to-tracker:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin-only: create admin internship
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const adminId = req.user.id;
    const { title, company_name } = req.body;
    if (!title || !company_name) {
      return res.status(400).json({ message: 'Title and company_name are required' });
    }
    const created = await createAdminInternship(adminId, req.body);
    return res.status(201).json(created);
  } catch (err) {
    console.error('Error in POST /admin-internships:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin-only: update admin internship
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await updateAdminInternship(id, req.body);
    if (!ok) {
      return res.status(404).json({ message: 'Internship not found or no fields to update' });
    }
    const updated = await getAdminInternshipById(id);
    return res.json(updated);
  } catch (err) {
    console.error('Error in PUT /admin-internships/:id:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin-only: delete admin internship
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await deleteAdminInternship(id);
    if (!ok) {
      return res.status(404).json({ message: 'Internship not found' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /admin-internships/:id:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

