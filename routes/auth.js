const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { sendEmail } = require('../utils/email');

const router = express.Router();

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department, classYear, classLabel } = req.body;

    if (!email || !email.endsWith('@cea.ac.in')) {
      return res.status(400).json({ message: 'Only @cea.ac.in emails are allowed' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, class_year, class_label, account_status, otp_code, otp_expires_at)
       VALUES (?, ?, ?, 'STUDENT', ?, ?, ?, 'UNVERIFIED', ?, ?)`,
      [name, email, passwordHash, department, classYear, classLabel, otp, otpExpiresAt]
    );

    await sendEmail({
      to: email,
      subject: 'Internship Tracker - Email Verification OTP',
      text: `Your OTP is ${otp}. It is valid for 15 minutes.`,
    });

    return res.status(201).json({ message: 'Registered successfully. Please verify OTP sent to your email.' });
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const [rows] = await pool.query('SELECT id, otp_code, otp_expires_at, account_status FROM users WHERE email = ?', [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or OTP' });
    }

    const user = rows[0];
    if (user.account_status !== 'UNVERIFIED') {
      return res.status(400).json({ message: 'OTP already verified or account status changed' });
    }

    if (!user.otp_code || user.otp_code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otp_expires_at && new Date(user.otp_expires_at) < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    await pool.query(
      'UPDATE users SET account_status = ?, otp_code = NULL, otp_expires_at = NULL WHERE id = ?',
      ['PENDING_APPROVAL', user.id]
    );

    return res.status(200).json({ message: 'OTP verified. Awaiting admin approval.' });
  } catch (err) {
    return res.status(500).json({ message: 'OTP verification failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query(
      'SELECT id, name, email, password_hash, role, department, class_year, class_label, account_status FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    if (user.account_status !== 'APPROVED') {
      return res.status(403).json({ message: 'Account not approved yet' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        department: user.department,
        classYear: user.class_year,
        classLabel: user.class_label,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        classYear: user.class_year,
        classLabel: user.class_label,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed' });
  }
});

module.exports = router;

