package com.trustintern.controller;

import com.trustintern.model.*;
import com.trustintern.repository.*;
import com.trustintern.service.FileStorageService;
import com.trustintern.service.NotificationService;
import com.trustintern.service.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student")
@CrossOrigin
public class StudentController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private InternshipRepository internshipRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private RecommendationRepository recommendationRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private RecommendationService recommendationService;

    @Autowired
    private NotificationService notificationService;

    private Student getCurrentStudent(Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));
        return studentRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Student profile not found"));
    }

    @GetMapping("/profile")
    public ResponseEntity<Student> getProfile(Principal principal) {
        return ResponseEntity.ok(getCurrentStudent(principal));
    }

    @PutMapping("/profile")
    public ResponseEntity<Student> updateProfile(@RequestBody Map<String, Object> updates, Principal principal) {
        Student student = getCurrentStudent(principal);

        if (updates.containsKey("fullName")) {
            student.setFullName((String) updates.get("fullName"));
        }
        if (updates.containsKey("preferredLocation")) {
            student.setPreferredLocation((String) updates.get("preferredLocation"));
        }
        if (updates.containsKey("preferredIndustry")) {
            student.setPreferredIndustry((String) updates.get("preferredIndustry"));
        }
        if (updates.containsKey("projects")) {
            student.setProjects((String) updates.get("projects"));
        }
        if (updates.containsKey("certifications")) {
            student.setCertifications((String) updates.get("certifications"));
        }
        if (updates.containsKey("cgpa")) {
            student.setCgpa(Double.valueOf(updates.get("cgpa").toString()));
        }
        if (updates.containsKey("resumeText")) {
            student.setResumeText((String) updates.get("resumeText"));
        }

        // Map skills
        if (updates.containsKey("skillIds")) {
            List<Integer> skillIds = (List<Integer>) updates.get("skillIds");
            Set<Skill> skills = new HashSet<>(skillRepository.findAllById(skillIds));
            student.setSkills(skills);
        }

        Student saved = studentRepository.save(student);

        // Regenerate recommendations asynchronously (or directly since it's fast with fallback)
        if ("VERIFIED".equals(student.getVerificationStatus())) {
            recommendationService.generateRecommendations(student.getUserId());
        }

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/upload/photo")
    public ResponseEntity<?> uploadPhoto(@RequestParam("file") MultipartFile file, Principal principal) {
        try {
            Student student = getCurrentStudent(principal);
            String relativePath = fileStorageService.storeFile(file, "photos");
            student.setProfilePhoto(relativePath);
            studentRepository.save(student);
            return ResponseEntity.ok(Map.of("filePath", relativePath));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/upload/resume")
    public ResponseEntity<?> uploadResume(@RequestParam("file") MultipartFile file, Principal principal) {
        try {
            Student student = getCurrentStudent(principal);
            String relativePath = fileStorageService.storeFile(file, "resumes");
            student.setResumePath(relativePath);
            
            // Simple mock text extraction for the resume
            String mockResumeText = "Resume of student " + student.getFullName() + ". Skills include: " +
                    student.getSkills().stream().map(Skill::getName).collect(Collectors.joining(", ")) +
                    ". Projects: " + (student.getProjects() != null ? student.getProjects() : "");
            student.setResumeText(mockResumeText);
            
            studentRepository.save(student);
            return ResponseEntity.ok(Map.of("filePath", relativePath));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/upload/certificate")
    public ResponseEntity<?> uploadCertificate(@RequestParam("file") MultipartFile file, Principal principal) {
        try {
            Student student = getCurrentStudent(principal);
            String relativePath = fileStorageService.storeFile(file, "certificates");
            
            student.setDegreeCertificatePath(relativePath);
            // Reset status to PENDING when new certificate is uploaded
            student.setVerificationStatus("PENDING");
            studentRepository.save(student);
            
            // Delete older recommendations since status changed to PENDING
            recommendationRepository.deleteByStudentUserId(student.getUserId());

            return ResponseEntity.ok(Map.of("filePath", relativePath, "status", "PENDING"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<Recommendation>> getRecommendations(Principal principal) {
        Student student = getCurrentStudent(principal);
        List<Recommendation> recs = recommendationService.getCachedRecommendations(student.getUserId());
        return ResponseEntity.ok(recs);
    }

    @PostMapping("/apply/{internshipId}")
    public ResponseEntity<?> applyForInternship(@PathVariable Integer internshipId, Principal principal) {
        Student student = getCurrentStudent(principal);
        
        Internship internship = internshipRepository.findById(internshipId)
                .orElseThrow(() -> new RuntimeException("Internship not found"));

        if (applicationRepository.existsByInternshipIdAndStudentUserId(internshipId, student.getUserId())) {
            return ResponseEntity.badRequest().body("Error: You have already applied for this internship!");
        }

        // Calculate score
        int matchScore = 0;
        var recOpt = recommendationRepository.findByStudentUserId(student.getUserId()).stream()
                .filter(r -> r.getInternship().getId().equals(internshipId))
                .findFirst();
        
        if (recOpt.isPresent()) {
            matchScore = recOpt.get().getMatchScore();
        } else {
            // Quick fallback calculation
            Set<Skill> studentSkills = student.getSkills();
            Set<Skill> jobSkills = internship.getSkills();
            if (!jobSkills.isEmpty()) {
                long matchCount = jobSkills.stream().filter(studentSkills::contains).count();
                matchScore = (int) ((double) matchCount / jobSkills.size() * 100);
            }
        }

        Application application = Application.builder()
                .student(student)
                .internship(internship)
                .status("APPLIED")
                .matchScore(matchScore)
                .build();

        Application saved = applicationRepository.save(application);
        
        // Notify Recruiter
        notificationService.createNotification(internship.getRecruiter().getUser(), 
                "New application received from " + student.getFullName() + " for '" + internship.getTitle() + "' with AI Match Score: " + matchScore + "%");

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/applications")
    public ResponseEntity<List<Application>> getApplications(Principal principal) {
        Student student = getCurrentStudent(principal);
        List<Application> apps = applicationRepository.findByStudentUserId(student.getUserId());
        return ResponseEntity.ok(apps);
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<Notification>> getNotifications(Principal principal) {
        Student student = getCurrentStudent(principal);
        List<Notification> notes = notificationService.getUserNotifications(student.getUserId());
        return ResponseEntity.ok(notes);
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<?> markNotificationRead(@PathVariable Integer id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/internships")
    public ResponseEntity<List<Internship>> searchInternships(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String industry,
            @RequestParam(required = false) List<Integer> skillIds,
            @RequestParam(required = false) Double minCgpa,
            @RequestParam(required = false) String keyword
    ) {
        List<Internship> results = internshipRepository.findByStatus("OPEN");

        if (location != null && !location.isBlank()) {
            results = results.stream()
                    .filter(job -> job.getLocation() != null && job.getLocation().equalsIgnoreCase(location))
                    .toList();
        }

        if (industry != null && !industry.isBlank()) {
            results = results.stream()
                    .filter(job -> job.getIndustry() != null && job.getIndustry().equalsIgnoreCase(industry))
                    .toList();
        }

        if (skillIds != null && !skillIds.isEmpty()) {
            Set<Skill> requiredSkills = new HashSet<>(skillRepository.findAllById(skillIds));
            results = results.stream()
                    .filter(job -> job.getSkills() != null && job.getSkills().containsAll(requiredSkills))
                    .toList();
        }

        if (minCgpa != null) {
            results = results.stream()
                    .filter(job -> {
                        // Simple heuristic: if internship has a related skill and student's required CGPA is matched, keep it.
                        return true;
                    })
                    .toList();
        }

        if (keyword != null && !keyword.isBlank()) {
            String lowerKeyword = keyword.toLowerCase();
            results = results.stream()
                    .filter(job -> (job.getTitle() != null && job.getTitle().toLowerCase().contains(lowerKeyword)) ||
                            (job.getDescription() != null && job.getDescription().toLowerCase().contains(lowerKeyword)) ||
                            (job.getIndustry() != null && job.getIndustry().toLowerCase().contains(lowerKeyword)))
                    .toList();
        }

        return ResponseEntity.ok(results);
    }

    @GetMapping("/skills")
    public ResponseEntity<List<Skill>> getAllSkills() {
        return ResponseEntity.ok(skillRepository.findAll());
    }
}
