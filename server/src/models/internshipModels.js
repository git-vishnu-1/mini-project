const { getPool } = require('../config/db');

// Student internships
async function getStudentInternships(userId) {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT * FROM student_internships WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows;
}

async function getStudentInternshipById(userId, id) {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT * FROM student_internships WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return rows[0] || null;
}

async function createStudentInternship(userId, data) {
  const pool = getPool();
  const {
    admin_internship_id = null,
    title,
    company_name,
    location = null,
    job_type = null,
    job_link = null,
    description = null,
    status = 'Pending',
    date_applied = null,
    interview_date = null,
    offer_date = null,
    application_deadline = null,
    offer_deadline = null,
    reminder_enabled = 1,
    contact_name = null,
    contact_email = null,
    contact_phone = null,
    contact_linkedin = null,
    notes = null,
    tags = null,
    resume_label = null,
    cover_letter_label = null,
    other_docs_label = null,
  } = data;

  const [result] = await pool.execute(
    `INSERT INTO student_internships
    (user_id, admin_internship_id, title, company_name, location, job_type, job_link, description,
     status, date_applied, interview_date, offer_date, application_deadline, offer_deadline,
     reminder_enabled, contact_name, contact_email, contact_phone, contact_linkedin,
     notes, tags, resume_label, cover_letter_label, other_docs_label, last_status_change_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      userId,
      admin_internship_id,
      title,
      company_name,
      location,
      job_type,
      job_link,
      description,
      status,
      date_applied,
      interview_date,
      offer_date,
      application_deadline,
      offer_deadline,
      reminder_enabled,
      contact_name,
      contact_email,
      contact_phone,
      contact_linkedin,
      notes,
      tags,
      resume_label,
      cover_letter_label,
      other_docs_label,
    ]
  );

  return { id: result.insertId, ...data, user_id: userId };
}

async function updateStudentInternship(userId, id, data) {
  const pool = getPool();

  // Build dynamic query for partial updates
  const fields = [];
  const values = [];

  const updatableFields = [
    'title',
    'company_name',
    'location',
    'job_type',
    'job_link',
    'description',
    'status',
    'date_applied',
    'interview_date',
    'offer_date',
    'application_deadline',
    'offer_deadline',
    'reminder_enabled',
    'contact_name',
    'contact_email',
    'contact_phone',
    'contact_linkedin',
    'notes',
    'tags',
    'resume_label',
    'cover_letter_label',
    'other_docs_label',
  ];

  let statusUpdated = false;

  updatableFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      fields.push(`${field} = ?`);
      values.push(data[field]);
      if (field === 'status') {
        statusUpdated = true;
      }
    }
  });

  if (fields.length === 0) {
    return false;
  }

  let query = `UPDATE student_internships SET ${fields.join(', ')}, updated_at = NOW()`;
  if (statusUpdated) {
    query += ', last_status_change_at = NOW()';
  }
  query += ' WHERE id = ? AND user_id = ?';

  values.push(id, userId);

  const [result] = await pool.execute(query, values);
  return result.affectedRows > 0;
}

async function deleteStudentInternship(userId, id) {
  const pool = getPool();
  const [result] = await pool.execute('DELETE FROM student_internships WHERE id = ? AND user_id = ?', [id, userId]);
  return result.affectedRows > 0;
}

// Admin internships
async function getAdminInternships() {
  const pool = getPool();
  const [rows] = await pool.execute('SELECT * FROM admin_internships ORDER BY created_at DESC');
  return rows;
}

async function getAdminInternshipById(id) {
  const pool = getPool();
  const [rows] = await pool.execute('SELECT * FROM admin_internships WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createAdminInternship(adminId, data) {
  const pool = getPool();
  const {
    title,
    company_name,
    location = null,
    job_type = null,
    job_link = null,
    description = null,
    application_deadline = null,
    offer_deadline = null,
    contact_name = null,
    contact_email = null,
    contact_phone = null,
    contact_linkedin = null,
  } = data;

  const [result] = await pool.execute(
    `INSERT INTO admin_internships
    (title, company_name, location, job_type, job_link, description,
     application_deadline, offer_deadline,
     contact_name, contact_email, contact_phone, contact_linkedin,
     created_by_admin_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      company_name,
      location,
      job_type,
      job_link,
      description,
      application_deadline,
      offer_deadline,
      contact_name,
      contact_email,
      contact_phone,
      contact_linkedin,
      adminId,
    ]
  );

  return { id: result.insertId, ...data, created_by_admin_id: adminId };
}

async function updateAdminInternship(id, data) {
  const pool = getPool();
  const fields = [];
  const values = [];

  const updatableFields = [
    'title',
    'company_name',
    'location',
    'job_type',
    'job_link',
    'description',
    'application_deadline',
    'offer_deadline',
    'contact_name',
    'contact_email',
    'contact_phone',
    'contact_linkedin',
  ];

  updatableFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      fields.push(`${field} = ?`);
      values.push(data[field]);
    }
  });

  if (fields.length === 0) {
    return false;
  }

  const query = `UPDATE admin_internships SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
  values.push(id);

  const [result] = await pool.execute(query, values);
  return result.affectedRows > 0;
}

async function deleteAdminInternship(id) {
  const pool = getPool();
  const [result] = await pool.execute('DELETE FROM admin_internships WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function getStatusCountsForStudent(userId) {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT status, COUNT(*) as count FROM student_internships WHERE user_id = ? GROUP BY status',
    [userId]
  );
  return rows;
}

async function getGlobalStatusCounts() {
  const pool = getPool();
  const [rows] = await pool.execute('SELECT status, COUNT(*) as count FROM student_internships GROUP BY status');
  return rows;
}

module.exports = {
  getStudentInternships,
  getStudentInternshipById,
  createStudentInternship,
  updateStudentInternship,
  deleteStudentInternship,
  getAdminInternships,
  getAdminInternshipById,
  createAdminInternship,
  updateAdminInternship,
  deleteAdminInternship,
  getStatusCountsForStudent,
  getGlobalStatusCounts,
};

