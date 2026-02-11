CREATE DATABASE IF NOT EXISTS internship_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE internship_tracker;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Admin internships (templates created by admins)
CREATE TABLE IF NOT EXISTS admin_internships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  company_name VARCHAR(150) NOT NULL,
  location VARCHAR(150),
  job_type VARCHAR(50),
  job_link VARCHAR(500),
  description TEXT,
  application_deadline DATE,
  offer_deadline DATE,
  contact_name VARCHAR(150),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_linkedin VARCHAR(255),
  created_by_admin_id INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_internships_created_by
    FOREIGN KEY (created_by_admin_id) REFERENCES users(id)
    ON DELETE SET NULL
);

-- Student internships (per-student tracking)
CREATE TABLE IF NOT EXISTS student_internships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  admin_internship_id INT,
  title VARCHAR(150) NOT NULL,
  company_name VARCHAR(150) NOT NULL,
  location VARCHAR(150),
  job_type VARCHAR(50),
  job_link VARCHAR(500),
  description TEXT,
  status ENUM('Pending', 'Applied', 'Interviewing', 'Accepted', 'Rejected') NOT NULL DEFAULT 'Pending',
  date_applied DATE,
  interview_date DATE,
  offer_date DATE,
  application_deadline DATE,
  offer_deadline DATE,
  reminder_enabled TINYINT(1) NOT NULL DEFAULT 1,
  contact_name VARCHAR(150),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_linkedin VARCHAR(255),
  notes TEXT,
  tags VARCHAR(255),
  resume_label VARCHAR(100),
  cover_letter_label VARCHAR(100),
  other_docs_label VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_status_change_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_internships_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_student_internships_admin
    FOREIGN KEY (admin_internship_id) REFERENCES admin_internships(id)
    ON DELETE SET NULL
);

