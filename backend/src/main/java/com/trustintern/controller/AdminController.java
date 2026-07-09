package com.trustintern.controller;

import com.trustintern.blockchain.Block;
import com.trustintern.blockchain.BlockRepository;
import com.trustintern.blockchain.BlockchainService;
import com.trustintern.model.*;
import com.trustintern.repository.*;
import com.trustintern.service.VerificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private RecruiterRepository recruiterRepository;

    @Autowired
    private CertificateRecordRepository certificateRecordRepository;

    @Autowired
    private UniversityRepository universityRepository;

    @Autowired
    private BlockRepository blockRepository;

    @Autowired
    private BlockchainService blockchainService;

    @Autowired
    private VerificationService verificationService;

    @Autowired
    private InternshipRepository internshipRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean emailVerified
    ) {
        List<User> users = userRepository.findAll();
        if (role != null && !role.isBlank()) {
            users = users.stream()
                    .filter(user -> role.equalsIgnoreCase(user.getRole()))
                    .toList();
        }
        if (emailVerified != null) {
            users = users.stream()
                    .filter(user -> emailVerified.equals(user.getEmailVerified()))
                    .toList();
        }
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (body.containsKey("role")) {
            String newRole = (String) body.get("role");
            if (newRole == null || (!newRole.equals("ROLE_ADMIN") && !newRole.equals("ROLE_STUDENT") && !newRole.equals("ROLE_RECRUITER"))) {
                throw new RuntimeException("Invalid role specified.");
            }
            user.setRole(newRole);
        }
        if (body.containsKey("emailVerified")) {
            user.setEmailVerified(Boolean.valueOf(body.get("emailVerified").toString()));
        }

        return ResponseEntity.ok(userRepository.save(user));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok("User deleted successfully!");
    }

    @GetMapping("/students")
    public ResponseEntity<List<Student>> getAllStudents() {
        return ResponseEntity.ok(studentRepository.findAll());
    }

    @GetMapping("/recruiters")
    public ResponseEntity<List<Recruiter>> getAllRecruiters() {
        return ResponseEntity.ok(recruiterRepository.findAll());
    }

    @GetMapping("/certificates/records")
    public ResponseEntity<List<CertificateRecord>> getCertificateRecords() {
        return ResponseEntity.ok(certificateRecordRepository.findAll());
    }

    @PostMapping("/certificates/records")
    public ResponseEntity<?> createCertificateRecord(@RequestBody Map<String, Object> body) {
        Integer universityId = (Integer) body.get("universityId");
        University university = universityRepository.findById(universityId)
                .orElseThrow(() -> new RuntimeException("University not found"));

        CertificateRecord record = CertificateRecord.builder()
                .certificateId((String) body.get("certificateId"))
                .studentName((String) body.get("studentName"))
                .registerNumber((String) body.get("registerNumber"))
                .university(university)
                .degree((String) body.get("degree"))
                .cgpa(Double.valueOf(body.get("cgpa").toString()))
                .certificateHash((String) body.get("certificateHash"))
                .build();

        return ResponseEntity.ok(certificateRecordRepository.save(record));
    }

    @GetMapping("/certificates/pending")
    public ResponseEntity<List<Student>> getPendingCertificates() {
        // Find students whose verification status is PENDING and have uploaded a degree certificate file
        List<Student> pending = studentRepository.findByVerificationStatus("PENDING").stream()
                .filter(s -> s.getDegreeCertificatePath() != null)
                .toList();
        return ResponseEntity.ok(pending);
    }

    @GetMapping("/certificates/verify-ocr/{studentId}")
    public ResponseEntity<?> verifyOcr(@PathVariable Integer studentId) {
        try {
            VerificationService.VerificationReport report = verificationService.analyzeCertificate(studentId);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error analyzing certificate: " + e.getMessage());
        }
    }

    @PostMapping("/certificates/approve/{studentId}")
    public ResponseEntity<?> approveCertificate(@PathVariable Integer studentId, @RequestParam String certificateId) {
        try {
            verificationService.approveAndMintBlock(studentId, certificateId);
            return ResponseEntity.ok("Certificate verified and added to Blockchain!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error approving certificate: " + e.getMessage());
        }
    }

    @PostMapping("/certificates/reject/{studentId}")
    public ResponseEntity<?> rejectCertificate(@PathVariable Integer studentId, @RequestParam String reason) {
        try {
            verificationService.rejectCertificate(studentId, reason);
            return ResponseEntity.ok("Certificate rejected successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error rejecting certificate: " + e.getMessage());
        }
    }

    @GetMapping("/blockchain/ledger")
    public ResponseEntity<List<Block>> getBlockchainLedger() {
        return ResponseEntity.ok(blockRepository.findAll());
    }

    @GetMapping("/blockchain/validate")
    public ResponseEntity<?> validateBlockchain() {
        boolean isValid = blockchainService.isChainValid();
        Map<String, Object> response = new HashMap<>();
        response.put("valid", isValid);
        response.put("message", isValid ? "Blockchain integrity verified. Ledger matches hashes perfectly." : "WARNING: Blockchain integrity is compromised! Hash mismatch detected.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long totalStudents = studentRepository.count();
        long totalRecruiters = recruiterRepository.count();
        long totalInternships = internshipRepository.count();
        long totalApplications = applicationRepository.count();
        long verifiedCerts = studentRepository.findByVerificationStatus("VERIFIED").size();
        long pendingCerts = studentRepository.findByVerificationStatus("PENDING").stream()
                .filter(s -> s.getDegreeCertificatePath() != null).count();
        
        boolean blockchainValid = blockchainService.isChainValid();
        long blockchainBlocks = blockRepository.count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalStudents", totalStudents);
        stats.put("totalRecruiters", totalRecruiters);
        stats.put("totalInternships", totalInternships);
        stats.put("totalApplications", totalApplications);
        stats.put("verifiedCertificates", verifiedCerts);
        stats.put("pendingCertificates", pendingCerts);
        stats.put("blockchainBlocks", blockchainBlocks);
        stats.put("blockchainIntegrity", blockchainValid);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/universities")
    public ResponseEntity<List<University>> getUniversities() {
        return ResponseEntity.ok(universityRepository.findAll());
    }
}
