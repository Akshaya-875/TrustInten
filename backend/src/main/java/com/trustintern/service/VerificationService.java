package com.trustintern.service;

import com.trustintern.blockchain.Block;
import com.trustintern.blockchain.BlockRepository;
import com.trustintern.blockchain.BlockchainService;
import com.trustintern.model.CertificateRecord;
import com.trustintern.model.Student;
import com.trustintern.model.User;
import com.trustintern.repository.CertificateRecordRepository;
import com.trustintern.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class VerificationService {

    @Value("${trustintern.ai.url}")
    private String aiServiceUrl;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private CertificateRecordRepository certificateRecordRepository;

    @Autowired
    private BlockRepository blockRepository;

    @Autowired
    private BlockchainService blockchainService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private NotificationService notificationService;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * DTO containing details extracted by OCR and comparison evaluation.
     */
    public static class VerificationReport {
        public String ocrName;
        public String ocrRegisterNumber;
        public String ocrUniversity;
        public String ocrDegree;
        public Double ocrCgpa;
        public String ocrCertificateId;
        public String fileHash;
        
        public String matchStatus; // VERIFIED, FAKE, TAMPERED
        public boolean blockchainVerified;
        public CertificateRecord registryRecord;
    }

    /**
     * Performs OCR and details comparison.
     */
    public VerificationReport analyzeCertificate(Integer studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (student.getDegreeCertificatePath() == null) {
            throw new RuntimeException("Student has not uploaded a degree certificate");
        }

        Path certPath = fileStorageService.getFile(student.getDegreeCertificatePath());
        String fileHash = fileStorageService.calculateSha256(certPath);

        // 1. Check if it's already verified in the Blockchain
        Optional<Block> blockchainBlock = blockRepository.findByCertificateHash(fileHash);
        
        VerificationReport report = new VerificationReport();
        report.fileHash = fileHash;

        if (blockchainBlock.isPresent()) {
            // Already validated in the blockchain!
            Block block = blockchainBlock.get();
            report.blockchainVerified = true;
            report.matchStatus = "VERIFIED";
            report.ocrCertificateId = block.getCertificateId();
            
            // Fetch registry record
            certificateRecordRepository.findByCertificateId(block.getCertificateId())
                    .ifPresent(record -> report.registryRecord = record);
            
            return report;
        }

        // 2. Not in blockchain, perform OCR using Python Flask Service
        Map<String, Object> ocrData = callOcrApi(certPath);
        report.ocrName = (String) ocrData.get("name");
        report.ocrRegisterNumber = (String) ocrData.get("register_number");
        report.ocrUniversity = (String) ocrData.get("university");
        report.ocrDegree = (String) ocrData.get("degree");
        report.ocrCertificateId = (String) ocrData.get("certificate_id");
        if (ocrData.get("cgpa") != null) {
            report.ocrCgpa = Double.valueOf(ocrData.get("cgpa").toString());
        }

        // 3. Match with genuine records
        if (report.ocrCertificateId == null) {
            report.matchStatus = "FAKE";
            return report;
        }

        Optional<CertificateRecord> registryRecordOpt = certificateRecordRepository.findByCertificateId(report.ocrCertificateId);
        if (registryRecordOpt.isEmpty()) {
            // If ID not found in master list, it is Fake
            report.matchStatus = "FAKE";
        } else {
            CertificateRecord registry = registryRecordOpt.get();
            report.registryRecord = registry;

            // Simple verification comparisons
            boolean registerNumMatches = student.getUser().getUsername().toLowerCase().contains(registry.getRegisterNumber().toLowerCase()) 
                    || (report.ocrRegisterNumber != null && report.ocrRegisterNumber.equalsIgnoreCase(registry.getRegisterNumber()));
            
            boolean cgpaMatches = Math.abs(registry.getCgpa() - (report.ocrCgpa != null ? report.ocrCgpa : student.getCgpa())) < 0.1;
            
            // Name comparison (handling case and whitespace)
            boolean nameMatches = false;
            if (report.ocrName != null) {
                nameMatches = report.ocrName.equalsIgnoreCase(registry.getStudentName())
                        || registry.getStudentName().toLowerCase().contains(report.ocrName.toLowerCase());
            }

            if (nameMatches && registerNumMatches && cgpaMatches) {
                report.matchStatus = "VERIFIED"; // Extracted details match registry details perfectly
            } else {
                report.matchStatus = "TAMPERED"; // ID matches registry, but metadata details do not match
            }
        }

        return report;
    }

    /**
     * Admin approves verification: mints block, updates status, sends alert.
     */
    @Transactional
    public synchronized void approveAndMintBlock(Integer studentId, String certificateId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (student.getDegreeCertificatePath() == null) {
            throw new RuntimeException("Degree certificate file is missing");
        }

        Path certPath = fileStorageService.getFile(student.getDegreeCertificatePath());
        String fileHash = fileStorageService.calculateSha256(certPath);

        // Verify if block already exists
        if (blockRepository.findByCertificateHash(fileHash).isPresent()) {
            throw new RuntimeException("Certificate block is already minted on blockchain");
        }

        // Mint block in blockchain
        blockchainService.addBlock(certificateId, studentId, fileHash);

        // Update student verification status
        student.setVerificationStatus("VERIFIED");
        studentRepository.save(student);

        // Create alert
        notificationService.createNotification(student.getUser(), 
                "Congratulations! Your academic certificate has been verified and registered on the Blockchain ledger.");
    }

    /**
     * Reject verification.
     */
    @Transactional
    public void rejectCertificate(Integer studentId, String reason) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        student.setVerificationStatus(reason.equalsIgnoreCase("tampered") ? "TAMPERED" : "FAKE");
        studentRepository.save(student);

        notificationService.createNotification(student.getUser(), 
                "Verification failed: Your certificate was marked as " + student.getVerificationStatus() + ". Reason: " + reason);
    }

    private Map<String, Object> callOcrApi(Path filePath) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new FileSystemResource(filePath.toFile()));

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            String url = aiServiceUrl + "/api/ocr";
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (Map<String, Object>) response.getBody();
            }
            throw new RuntimeException("OCR service returned status: " + response.getStatusCode());
        } catch (Exception e) {
            System.err.println("OCR API call failed: " + e.getMessage());
            // Return fallback dictionary so system does not crash on dev environments without Tesseract
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("name", "Fallback Name");
            fallback.put("register_number", "REG-FALLBACK");
            fallback.put("university", "Fallback University");
            fallback.put("degree", "Fallback Degree");
            fallback.put("cgpa", 8.0);
            fallback.put("certificate_id", "CERT-FALLBACK");
            return fallback;
        }
    }
}
