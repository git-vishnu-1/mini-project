CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('STUDENT', 'CLASS_TEACHER', 'HOD', 'PRINCIPAL', 'SYSTEM_ADMIN') NOT NULL,
  department ENUM('CSE', 'EEE', 'ECE', 'MECH') NULL,
  class_year VARCHAR(50) NULL,
  class_label VARCHAR(100) NULL,
  account_status ENUM('UNVERIFIED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'UNVERIFIED',
  otp_code VARCHAR(10) NULL,
  otp_expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS internships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  stipend VARCHAR(255),
  application_link VARCHAR(500),
  deadline DATE,
  status ENUM(
    'Planned',
    'Applied',
    'Interview - Round 1',
    'Interview - Round 2',
    'Offer',
    'Accepted',
    'Rejected',
    'Withdrawn'
  ) NOT NULL DEFAULT 'Planned',
  applied_date DATE,
  interview_round1_date DATE,
  interview_round2_date DATE,
  offer_details TEXT,
  notes TEXT,
  resume_path VARCHAR(500),
  completion_certificate_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_internships_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

