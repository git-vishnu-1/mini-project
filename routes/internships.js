const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${req.user.id}-${uniqueSuffix}-${file.originalname}`);
  },
});

function fileFilter(req, file, cb) {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.use(authenticate, authorize(['STUDENT']));

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM internships WHERE student_id = ?', [req.user.id]);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch internships' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      companyName,
      role,
      location,
      stipend,
      applicationLink,
      deadline,
      status,
      appliedDate,
      interviewRound1Date,
      interviewRound2Date,
      offerDetails,
      notes,
    } = req.body;

    await pool.query(
      `INSERT INTO internships
      (student_id, company_name, role, location, stipend, application_link, deadline, status, applied_date,
       interview_round1_date, interview_round2_date, offer_details, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        companyName,
        role,
        location,
        stipend,
        applicationLink,
        deadline || null,
        status || 'Planned',
        appliedDate || null,
        interviewRound1Date || null,
        interviewRound2Date || null,
        offerDetails || null,
        notes || null,
      ]
    );

    return res.status(201).json({ message: 'Internship created' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create internship' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      companyName,
      role,
      location,
      stipend,
      applicationLink,
      deadline,
      status,
      appliedDate,
      interviewRound1Date,
      interviewRound2Date,
      offerDetails,
      notes,
    } = req.body;

    await pool.query(
      `UPDATE internships
       SET company_name = ?, role = ?, location = ?, stipend = ?, application_link = ?, deadline = ?, status = ?,
           applied_date = ?, interview_round1_date = ?, interview_round2_date = ?, offer_details = ?, notes = ?
       WHERE id = ? AND student_id = ?`,
      [
        companyName,
        role,
        location,
        stipend,
        applicationLink,
        deadline || null,
        status,
        appliedDate || null,
        interviewRound1Date || null,
        interviewRound2Date || null,
        offerDetails || null,
        notes || null,
        id,
        req.user.id,
      ]
    );

    return res.json({ message: 'Internship updated' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update internship' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM internships WHERE id = ? AND student_id = ?', [id, req.user.id]);
    return res.json({ message: 'Internship deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete internship' });
  }
});

router.post(
  '/:id/upload',
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'completionCertificate', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const resumeFile = req.files.resume ? req.files.resume[0] : null;
      const certificateFile = req.files.completionCertificate ? req.files.completionCertificate[0] : null;

      const [rows] = await pool.query('SELECT id FROM internships WHERE id = ? AND student_id = ?', [
        id,
        req.user.id,
      ]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Internship not found' });
      }

      await pool.query(
        'UPDATE internships SET resume_path = ?, completion_certificate_path = ? WHERE id = ?',
        [
          resumeFile ? resumeFile.filename : null,
          certificateFile ? certificateFile.filename : null,
          id,
        ]
      );

      return res.json({ message: 'Files uploaded successfully' });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to upload files' });
    }
  }
);

module.exports = router;

