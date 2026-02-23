const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function sendEmail({ to, subject, text, html }) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };

