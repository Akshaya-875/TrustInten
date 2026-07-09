-- TrustIntern AI Database Schema

CREATE DATABASE IF NOT EXISTS trustintern_db;
USE trustintern_db;

-- 1. Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL, -- ROLE_ADMIN, ROLE_STUDENT, ROLE_RECRUITER
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Universities table
CREATE TABLE IF NOT EXISTS universities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 3. Students table
CREATE TABLE IF NOT EXISTS students (
    user_id INT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    profile_photo VARCHAR(255),
    resume_path VARCHAR(255),
    resume_text TEXT,
    degree_certificate_path VARCHAR(255),
    mark_sheets_path VARCHAR(255),
    skill_certificates_path VARCHAR(255),
    verification_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, VERIFIED, FAKE, TAMPERED
    cgpa DECIMAL(4, 2) DEFAULT 0.00,
    preferred_location VARCHAR(100),
    preferred_industry VARCHAR(100),
    projects TEXT,
    certifications TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Recruiters table
CREATE TABLE IF NOT EXISTS recruiters (
    user_id INT PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    company_description TEXT,
    company_website VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Genuine Certificate Records (Uploaded by Admin for verification references)
CREATE TABLE IF NOT EXISTS certificate_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificate_id VARCHAR(50) NOT NULL UNIQUE,
    student_name VARCHAR(100) NOT NULL,
    register_number VARCHAR(50) NOT NULL,
    university_id INT,
    degree VARCHAR(100) NOT NULL,
    cgpa DECIMAL(4, 2) NOT NULL,
    certificate_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of certificate file
    FOREIGN KEY (university_id) REFERENCES universities(id)
) ENGINE=InnoDB;

-- 6. Custom Blockchain table
CREATE TABLE IF NOT EXISTS blockchain (
    block_number INT AUTO_INCREMENT PRIMARY KEY,
    certificate_id VARCHAR(50) NOT NULL,
    student_id INT NOT NULL,
    certificate_hash VARCHAR(64) NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    current_hash VARCHAR(64) NOT NULL,
    timestamp BIGINT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(user_id)
) ENGINE=InnoDB;

-- 7. Internships table
CREATE TABLE IF NOT EXISTS internships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recruiter_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    location VARCHAR(100) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    salary DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, CLOSED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recruiter_id) REFERENCES recruiters(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Skills table
CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 9. Student Skills mapping (Many-to-Many)
CREATE TABLE IF NOT EXISTS student_skills (
    student_id INT NOT NULL,
    skill_id INT NOT NULL,
    PRIMARY KEY (student_id, skill_id),
    FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Internship Skills mapping (Many-to-Many)
CREATE TABLE IF NOT EXISTS internship_skills (
    internship_id INT NOT NULL,
    skill_id INT NOT NULL,
    PRIMARY KEY (internship_id, skill_id),
    FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. Applications table
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    internship_id INT NOT NULL,
    student_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'APPLIED', -- APPLIED, SHORTLISTED, REJECTED, ACCEPTED
    match_score INT DEFAULT 0,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 12. Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    internship_id INT NOT NULL,
    match_score INT NOT NULL,
    skill_gap TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
    FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 13. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
