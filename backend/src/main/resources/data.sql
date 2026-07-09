-- TrustIntern AI Sample Data for H2

-- Insert Universities
INSERT INTO universities (name, code) VALUES
('Anna University', 'AU001'),
('Visvesvaraya Technological University', 'VTU002'),
('Jawaharlal Nehru Technological University', 'JNTU003'),
('Mumbai University', 'MU004');

-- Insert Skills
INSERT INTO skills (name) VALUES
('Java'),
('Python'),
('React'),
('HTML'),
('CSS'),
('Bootstrap'),
('Spring Boot'),
('MySQL'),
('Tesseract OCR'),
('OpenCV'),
('Machine Learning'),
('Data Analysis'),
('JavaScript'),
('C++'),
('REST APIs'),
('Git');

-- Insert Users (Password is 'password' for all, BCrypt encrypted)
-- Hash: $2b$10$EcotPYQKA1HnUr3RRL7EeeRsV3XqaNOZRywgZEvjyJc2jpsp80whu
INSERT INTO users (username, password, email, email_verified, role) VALUES
('admin', '$2b$10$EcotPYQKA1HnUr3RRL7EeeRsV3XqaNOZRywgZEvjyJc2jpsp80whu', 'admin@trustintern.com', TRUE, 'ROLE_ADMIN'),
('john_student', '$2b$10$EcotPYQKA1HnUr3RRL7EeeRsV3XqaNOZRywgZEvjyJc2jpsp80whu', 'john@student.com', FALSE, 'ROLE_STUDENT'),
('sarah_student', '$2b$10$EcotPYQKA1HnUr3RRL7EeeRsV3XqaNOZRywgZEvjyJc2jpsp80whu', 'sarah@student.com', FALSE, 'ROLE_STUDENT'),
('tech_recruiter', '$2b$10$EcotPYQKA1HnUr3RRL7EeeRsV3XqaNOZRywgZEvjyJc2jpsp80whu', 'recruiter@techcorp.com', TRUE, 'ROLE_RECRUITER');

-- Insert Students Details
INSERT INTO students (user_id, full_name, profile_photo, resume_path, resume_text, degree_certificate_path, verification_status, cgpa, preferred_location, preferred_industry, projects, certifications) VALUES
(2, 'John Doe', NULL, NULL, 'Enthusiastic developer with Java and Spring Boot experience. Completed a library management project.', NULL, 'PENDING', 8.50, 'Bangalore', 'Software Engineering', 'Library Management System in Spring Boot', 'Java SE 11 Programmer'),
(3, 'Sarah Jenkins', NULL, NULL, 'Python developer interested in Machine Learning and Data Science. Built a house price prediction model.', NULL, 'PENDING', 9.10, 'Mumbai', 'Data Science', 'House Price Prediction using Python', 'Python for Data Science (Coursera)');

-- Map Student Skills
-- John: Java, Spring Boot, MySQL, JavaScript
INSERT INTO student_skills (student_id, skill_id) VALUES
(2, 1), -- Java
(2, 7), -- Spring Boot
(2, 8), -- MySQL
(2, 13); -- JavaScript

-- Sarah: Python, Machine Learning, Data Analysis, OpenCV
INSERT INTO student_skills (student_id, skill_id) VALUES
(3, 2), -- Python
(3, 10), -- OpenCV
(3, 11), -- Machine Learning
(3, 12); -- Data Analysis

-- Insert Recruiter Details
INSERT INTO recruiters (user_id, company_name, company_description, company_website) VALUES
(4, 'TechCorp Solutions', 'A leading software development company specialized in enterprise Java and Python web apps.', 'https://techcorp.com');

-- Insert Sample Internships
INSERT INTO internships (recruiter_id, title, description, requirements, location, industry, salary, status) VALUES
(4, 'Java Developer Intern', 'Join our team as a Java Developer Intern. You will work on building scalable Spring Boot REST APIs and integrating with MySQL databases.', 'Knowledge of Java, Spring Boot, and SQL databases. Basic understanding of RESTful concepts.', 'Bangalore', 'Software Engineering', 15000.00, 'OPEN'),
(4, 'AI / Machine Learning Intern', 'We are looking for an AI/ML intern to work on data preprocessing, model building, and OpenCV image pipelines.', 'Proficiency in Python. Experience with Pandas, NumPy, Scikit-Learn. Understanding of computer vision is a plus.', 'Mumbai', 'Data Science', 18000.00, 'OPEN');

-- Map Internship Skills
-- Java Intern: Java, Spring Boot, MySQL, REST APIs
INSERT INTO internship_skills (internship_id, skill_id) VALUES
(1, 1),
(1, 7),
(1, 8),
(1, 15);

-- ML Intern: Python, OpenCV, Machine Learning, Data Analysis
INSERT INTO internship_skills (internship_id, skill_id) VALUES
(2, 2),
(2, 10),
(2, 11),
(2, 12);

-- Insert Sample University Certificate Master Records (Genuine Certificates for Verification Testing)
-- We pre-register two certificate records. Student Register numbers are 'REG101' (John) and 'REG202' (Sarah).
-- The certificate hashes represent mock SHA-256 hashes of their certificate documents.
INSERT INTO certificate_records (certificate_id, student_name, register_number, university_id, degree, cgpa, certificate_hash) VALUES
('CERT-2026-001', 'John Doe', 'REG101', 1, 'Bachelor of Engineering in Computer Science', 8.50, 'd5a3a789a7df64387ad67b36a188f5539d0c64488a03bb378e9c402120e2efc0'),
('CERT-2026-002', 'Sarah Jenkins', 'REG202', 2, 'Bachelor of Technology in Information Technology', 9.10, 'e87df34a2e5d167198e3b33364f9f25266854bf485e913a0c6488d01bc7dcf32');
