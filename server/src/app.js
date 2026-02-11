const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env if present
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const studentInternshipRoutes = require('./routes/studentInternshipRoutes');
const adminInternshipRoutes = require('./routes/adminInternshipRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { initReminderJobs } = require('./jobs/reminders');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/student-internships', studentInternshipRoutes);
app.use('/api/admin-internships', adminInternshipRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve static frontend (public folder at project root)
app.use(express.static(path.join(__dirname, '..', '..', 'public')));

const PORT = process.env.PORT || 4000;

// Start server and initialize scheduled jobs
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  initReminderJobs();
});

