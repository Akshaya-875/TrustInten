# TrustIntern AI

## AI-Powered Internship Recommendation and Academic Credential Verification Platform

TrustIntern AI is a full-stack web application developed as a Final Year Engineering Project. It combines Artificial Intelligence, OCR (Optical Character Recognition), SHA-256 hashing, and a private blockchain-inspired ledger to verify academic credentials and provide personalized internship recommendations.

The platform enables students to apply for internships using verified academic credentials, allows recruiters to recruit trusted candidates, and provides administrators with tools to verify certificates and manage the platform.

---

# Features

## Student Module

* Student Registration and Login
* JWT Authentication
* Profile Management
* Resume Upload
* Academic Certificate Upload
* Skill Certificate Upload
* Certificate Verification Status
* AI Internship Recommendations
* Internship Applications
* Application Tracking
* Notifications

---

## Recruiter Module

* Recruiter Registration and Login
* Company Profile Management
* Internship Posting
* Internship Editing and Deletion
* Candidate Search
* View Verified Candidates
* Application Management
* Shortlisting Candidates
* Status Updates

---

## Administrator Module

* User Management
* Recruiter Management
* Student Management
* Certificate Verification
* OCR Processing
* Blockchain Ledger Monitoring
* University Registry Management
* Platform Statistics

---

# Certificate Verification Workflow

1. Student uploads a certificate (PDF/JPG/PNG).
2. The backend stores the uploaded file.
3. SHA-256 hash is generated for the uploaded document.
4. OCR extracts certificate details such as:

   * Student Name
   * Register Number
   * University
   * Degree
   * CGPA
   * Certificate ID
5. Administrator reviews the extracted information.
6. The certificate is approved or rejected.
7. Approved certificates are recorded in the blockchain ledger.
8. The student's profile is marked as Verified.

---

# AI Internship Recommendation Workflow

The recommendation engine analyzes:

* Verified Degree
* Verified Certificates
* Skills
* Projects
* Resume Content
* Preferred Industry
* Preferred Location

Recommendation techniques include:

* TF-IDF
* Cosine Similarity
* Skill Matching
* Rule-Based Ranking

The system generates:

* Internship Match Score
* Recommended Internships
* Skill Gap Suggestions

---

# Blockchain Module

A lightweight private blockchain is implemented to maintain an immutable audit trail of verified certificates.

Each block contains:

* Block Number
* Certificate ID
* Student ID
* SHA-256 Certificate Hash
* Previous Block Hash
* Current Block Hash
* Timestamp

The blockchain ensures tamper-evident storage of certificate verification records.

---

# Technology Stack

## Frontend

* React.js
* Bootstrap
* Axios
* React Router

## Backend

* Spring Boot
* Spring Security
* Spring Data JPA
* REST APIs
* JWT Authentication

## Database

* H2 In-Memory Database (Demo)
* MySQL (Production Ready)

## AI Module

* Python
* Flask
* Scikit-Learn
* Pandas
* NumPy

## OCR

* Tesseract OCR
* OpenCV
* PyPDF2

## Security

* JWT
* BCrypt Password Encoder
* SHA-256 Hashing

---

# Project Structure

```text
TrustIntern-AI/

├── backend/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── entities/
│   ├── security/
│   └── resources/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── services/
│
├── ai-service/
│   ├── app.py
│   ├── recommendation.py
│   ├── ocr.py
│   └── requirements.txt
│
└── database/
```

---

# Database

Main tables include:

* Users
* Students
* Recruiters
* Certificates
* Blockchain
* Internships
* Applications
* Skills
* Notifications

---

# Default Login Credentials

The project includes sample users for demonstration.

| Role      | Username       | Password |
| --------- | -------------- | -------- |
| Admin     | admin          | password |
| Student   | john_student   | password |
| Student   | sarah_student  | password |
| Recruiter | tech_recruiter | password |

---

# Installation

## Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend runs on:

```
http://localhost:8080
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

## AI Service

```bash
cd ai-service

pip install -r requirements.txt

python app.py
```

Runs on:

```
http://localhost:5000
```

---

# H2 Database

The application uses an H2 in-memory database for demonstration.

H2 Console:

```
http://localhost:8080/h2-console
```

Database Configuration:

```
JDBC URL:
jdbc:h2:mem:trustintern_db

Username:
sa

Password:
(empty)
```

---

# Future Enhancements

* Integration with university ERP systems
* Automated certificate verification against trusted registries
* Advanced OCR for scanned and rotated documents
* Resume parsing using NLP
* Interview scheduling
* Email notifications
* Cloud deployment (AWS/Azure)
* Hyperledger Fabric integration
* Real-time recommendation learning

---

# Authors

Developed as a Final Year Engineering Project.

---

# License

This project is intended for educational and research purposes.
