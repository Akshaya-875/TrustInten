package com.trustintern.controller;

import com.trustintern.model.*;
import com.trustintern.repository.*;
import com.trustintern.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.*;

@RestController
@RequestMapping("/api/recruiter")
@CrossOrigin
public class RecruiterController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RecruiterRepository recruiterRepository;

    @Autowired
    private InternshipRepository internshipRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private NotificationService notificationService;

    private Recruiter getCurrentRecruiter(Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));
        return recruiterRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Recruiter profile not found"));
    }

    @GetMapping("/profile")
    public ResponseEntity<Recruiter> getProfile(Principal principal) {
        return ResponseEntity.ok(getCurrentRecruiter(principal));
    }

    @PutMapping("/profile")
    public ResponseEntity<Recruiter> updateProfile(@RequestBody Map<String, Object> updates, Principal principal) {
        Recruiter recruiter = getCurrentRecruiter(principal);

        if (updates.containsKey("companyName")) {
            recruiter.setCompanyName((String) updates.get("companyName"));
        }
        if (updates.containsKey("companyDescription")) {
            recruiter.setCompanyDescription((String) updates.get("companyDescription"));
        }
        if (updates.containsKey("companyWebsite")) {
            recruiter.setCompanyWebsite((String) updates.get("companyWebsite"));
        }

        return ResponseEntity.ok(recruiterRepository.save(recruiter));
    }

    @GetMapping("/internships")
    public ResponseEntity<List<Internship>> getMyInternships(Principal principal) {
        Recruiter recruiter = getCurrentRecruiter(principal);
        return ResponseEntity.ok(internshipRepository.findByRecruiterUserId(recruiter.getUserId()));
    }

    @PostMapping("/internships")
    public ResponseEntity<Internship> postInternship(@RequestBody Map<String, Object> body, Principal principal) {
        Recruiter recruiter = getCurrentRecruiter(principal);

        List<Integer> skillIds = (List<Integer>) body.get("skillIds");
        Set<Skill> skills = new HashSet<>(skillRepository.findAllById(skillIds));

        Internship internship = Internship.builder()
                .recruiter(recruiter)
                .title((String) body.get("title"))
                .description((String) body.get("description"))
                .requirements((String) body.get("requirements"))
                .location((String) body.get("location"))
                .industry((String) body.get("industry"))
                .salary(Double.valueOf(body.get("salary").toString()))
                .status("OPEN")
                .skills(skills)
                .build();

        return ResponseEntity.ok(internshipRepository.save(internship));
    }

    @PutMapping("/internships/{id}")
    public ResponseEntity<Internship> updateInternship(@PathVariable Integer id, @RequestBody Map<String, Object> body, Principal principal) {
        Recruiter recruiter = getCurrentRecruiter(principal);
        Internship internship = internshipRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Internship not found"));

        if (!internship.getRecruiter().getUserId().equals(recruiter.getUserId())) {
            throw new RuntimeException("Unauthorized: You do not own this internship");
        }

        if (body.containsKey("title")) {
            internship.setTitle((String) body.get("title"));
        }
        if (body.containsKey("description")) {
            internship.setDescription((String) body.get("description"));
        }
        if (body.containsKey("requirements")) {
            internship.setRequirements((String) body.get("requirements"));
        }
        if (body.containsKey("location")) {
            internship.setLocation((String) body.get("location"));
        }
        if (body.containsKey("industry")) {
            internship.setIndustry((String) body.get("industry"));
        }
        if (body.containsKey("salary")) {
            internship.setSalary(Double.valueOf(body.get("salary").toString()));
        }
        if (body.containsKey("status")) {
            internship.setStatus((String) body.get("status"));
        }
        if (body.containsKey("skillIds")) {
            List<Integer> skillIds = (List<Integer>) body.get("skillIds");
            Set<Skill> skills = new HashSet<>(skillRepository.findAllById(skillIds));
            internship.setSkills(skills);
        }

        return ResponseEntity.ok(internshipRepository.save(internship));
    }

    @DeleteMapping("/internships/{id}")
    public ResponseEntity<?> deleteInternship(@PathVariable Integer id, Principal principal) {
        Recruiter recruiter = getCurrentRecruiter(principal);
        Internship internship = internshipRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Internship not found"));

        if (!internship.getRecruiter().getUserId().equals(recruiter.getUserId())) {
            throw new RuntimeException("Unauthorized");
        }

        internshipRepository.delete(internship);
        return ResponseEntity.ok("Internship deleted successfully!");
    }

    @GetMapping("/applications")
    public ResponseEntity<List<Application>> getApplicationsReceived(Principal principal) {
        Recruiter recruiter = getCurrentRecruiter(principal);
        return ResponseEntity.ok(applicationRepository.findByInternshipRecruiterUserId(recruiter.getUserId()));
    }

    @PutMapping("/application/{appId}/status")
    public ResponseEntity<?> updateApplicationStatus(@PathVariable Integer appId, @RequestParam String status, Principal principal) {
        Recruiter recruiter = getCurrentRecruiter(principal);
        Application app = applicationRepository.findById(appId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (!app.getInternship().getRecruiter().getUserId().equals(recruiter.getUserId())) {
            throw new RuntimeException("Unauthorized");
        }

        app.setStatus(status.toUpperCase());
        applicationRepository.save(app);

        // Notify Student
        notificationService.createNotification(app.getStudent().getUser(), 
                "Your application status for '" + app.getInternship().getTitle() + "' at " + recruiter.getCompanyName() + 
                " has been updated to: " + status.toUpperCase());

        return ResponseEntity.ok(app);
    }

    @GetMapping("/candidates")
    public ResponseEntity<List<Student>> getCandidates(
            @RequestParam(defaultValue = "false") boolean onlyVerified,
            @RequestParam(required = false) List<Integer> skillIds,
            @RequestParam(required = false) Double minCgpa,
            @RequestParam(required = false) String preferredLocation,
            @RequestParam(required = false) String preferredIndustry,
            @RequestParam(required = false) String search
    ) {
        List<Student> candidates = onlyVerified ? studentRepository.findByVerificationStatus("VERIFIED") : studentRepository.findAll();

        if (skillIds != null && !skillIds.isEmpty()) {
            Set<Skill> requiredSkills = new HashSet<>(skillRepository.findAllById(skillIds));
            candidates = candidates.stream()
                    .filter(student -> student.getSkills() != null && student.getSkills().containsAll(requiredSkills))
                    .toList();
        }

        if (minCgpa != null) {
            candidates = candidates.stream()
                    .filter(student -> student.getCgpa() != null && student.getCgpa() >= minCgpa)
                    .toList();
        }

        if (preferredLocation != null && !preferredLocation.isBlank()) {
            candidates = candidates.stream()
                    .filter(student -> preferredLocation.equalsIgnoreCase(student.getPreferredLocation()))
                    .toList();
        }

        if (preferredIndustry != null && !preferredIndustry.isBlank()) {
            candidates = candidates.stream()
                    .filter(student -> preferredIndustry.equalsIgnoreCase(student.getPreferredIndustry()))
                    .toList();
        }

        if (search != null && !search.isBlank()) {
            String lowerSearch = search.toLowerCase();
            candidates = candidates.stream()
                    .filter(student -> (student.getFullName() != null && student.getFullName().toLowerCase().contains(lowerSearch)) ||
                            (student.getProjects() != null && student.getProjects().toLowerCase().contains(lowerSearch)) ||
                            (student.getCertifications() != null && student.getCertifications().toLowerCase().contains(lowerSearch)))
                    .toList();
        }

        return ResponseEntity.ok(candidates);
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<Notification>> getNotifications(Principal principal) {
        Recruiter recruiter = getCurrentRecruiter(principal);
        List<Notification> notes = notificationService.getUserNotifications(recruiter.getUserId());
        return ResponseEntity.ok(notes);
    }
}
