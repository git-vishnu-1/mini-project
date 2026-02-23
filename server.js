const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const dotenv = require('dotenv');
const pool = require('./config/db');
const { sendEmail } = require('./utils/email');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const internshipRoutes = require('./routes/internships');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const reminderDaysBefore = Number(process.env.REMINDER_DAYS_BEFORE || 3);

cron.schedule('0 7 * * *', async () => {
  try {
    const [rows] = await pool.query(
      `SELECT u.email, i.company_name, i.deadline
       FROM internships i
       INNER JOIN users u ON u.id = i.student_id
       WHERE i.deadline IS NOT NULL
         AND u.account_status = 'APPROVED'
         AND DATEDIFF(i.deadline, CURDATE()) IN (?, 0)`,
      [reminderDaysBefore]
    );

    const sendPromises = rows.map((row) =>
      sendEmail({
        to: row.email,
        subject: 'Internship Application Deadline Reminder',
        text: `Reminder: Your internship application for ${row.company_name} has a deadline on ${row.deadline}.`,
      })
    );

    await Promise.all(sendPromises);
  } catch (err) {
    // Intentionally ignore errors in cron to avoid crashing server
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${PORT}`);
});

