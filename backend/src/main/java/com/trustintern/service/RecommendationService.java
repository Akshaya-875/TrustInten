package com.trustintern.service;

import com.trustintern.model.Internship;
import com.trustintern.model.Recommendation;
import com.trustintern.model.Student;
import com.trustintern.model.Skill;
import com.trustintern.repository.InternshipRepository;
import com.trustintern.repository.RecommendationRepository;
import com.trustintern.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    @Value("${trustintern.ai.url}")
    private String aiServiceUrl;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private InternshipRepository internshipRepository;

    @Autowired
    private RecommendationRepository recommendationRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    @Transactional
    public List<Recommendation> generateRecommendations(Integer studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Only recommend using verified information, or if pending, we can allow it for presentation (but prompt says: "Only verified student information is used by the AI recommendation engine.")
        // Let's enforce that recommendations are only generated if student has VERIFIED status, OR we can return a message.
        // Wait, to make testing easy and avoid blocking, let's allow recommendation but check status. Let's do:
        if (!"VERIFIED".equals(student.getVerificationStatus())) {
            // We can return empty list or throw exception, let's throw exception or filter. Let's do:
            // "Only verified student information is used by the AI recommendation engine."
            // We will return empty list or throw a custom message. Let's return empty list if not verified so that they see they need to verify first!
            recommendationRepository.deleteByStudentUserId(studentId);
            return Collections.emptyList();
        }

        List<Internship> openJobs = internshipRepository.findByStatus("OPEN");
        if (openJobs.isEmpty()) {
            recommendationRepository.deleteByStudentUserId(studentId);
            return Collections.emptyList();
        }

        List<Recommendation> recommendations = new ArrayList<>();
        try {
            // Prepare Student Profile Payload
            Map<String, Object> studentPayload = new HashMap<>();
            List<String> studentSkills = student.getSkills().stream().map(Skill::getName).collect(Collectors.toList());
            studentPayload.put("skills", studentSkills);
            studentPayload.put("projects", student.getProjects() != null ? student.getProjects() : "");
            studentPayload.put("certifications", student.getCertifications() != null ? student.getCertifications() : "");
            studentPayload.put("degree", student.getFullName() != null ? "BE" : ""); // Mock degree details or read from student
            studentPayload.put("cgpa", student.getCgpa());
            studentPayload.put("preferred_location", student.getPreferredLocation() != null ? student.getPreferredLocation() : "");
            studentPayload.put("preferred_industry", student.getPreferredIndustry() != null ? student.getPreferredIndustry() : "");
            studentPayload.put("resume_text", student.getResumeText() != null ? student.getResumeText() : "");

            // Prepare Internships Payload
            List<Map<String, Object>> jobsPayload = new ArrayList<>();
            for (Internship job : openJobs) {
                Map<String, Object> jobMap = new HashMap<>();
                jobMap.put("id", job.getId());
                jobMap.put("title", job.getTitle());
                jobMap.put("description", job.getDescription());
                jobMap.put("requirements", job.getRequirements() != null ? job.getRequirements() : "");
                jobMap.put("location", job.getLocation());
                jobMap.put("industry", job.getIndustry());
                List<String> jobSkills = job.getSkills().stream().map(Skill::getName).collect(Collectors.toList());
                jobMap.put("skills", jobSkills);
                jobsPayload.add(jobMap);
            }

            // Prepare Request
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("student_profile", studentPayload);
            requestBody.put("internships", jobsPayload);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            String url = aiServiceUrl + "/api/recommend";
            ResponseEntity<List> response = restTemplate.postForEntity(url, entity, List.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> results = (List<Map<String, Object>>) response.getBody();
                
                // Delete previous recommendations
                recommendationRepository.deleteByStudentUserId(studentId);

                for (Map<String, Object> res : results) {
                    Integer jobId = (Integer) res.get("internship_id");
                    Integer score = (Integer) res.get("match_score");
                    List<String> gaps = (List<String>) res.get("skill_gap");
                    String skillGapStr = String.join(", ", gaps);

                    Internship job = internshipRepository.findById(jobId).orElse(null);
                    if (job != null) {
                        Recommendation rec = Recommendation.builder()
                                .student(student)
                                .internship(job)
                                .matchScore(score)
                                .skillGap(skillGapStr)
                                .build();
                        recommendations.add(recommendationRepository.save(rec));
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Recommendation AI API call failed, falling back to Java matching: " + e.getMessage());
            // Fallback matching in pure Java
            recommendations = runJavaFallbackMatching(student, openJobs);
        }

        return recommendations;
    }

    private List<Recommendation> runJavaFallbackMatching(Student student, List<Internship> openJobs) {
        recommendationRepository.deleteByStudentUserId(student.getUserId());
        List<Recommendation> recommendations = new ArrayList<>();

        Set<String> studentSkills = student.getSkills().stream()
                .map(s -> s.getName().toLowerCase().strip())
                .collect(Collectors.toSet());

        for (Internship job : openJobs) {
            Set<String> jobSkills = job.getSkills().stream()
                    .map(s -> s.getName().toLowerCase().strip())
                    .collect(Collectors.toSet());

            long matchCount = jobSkills.stream().filter(studentSkills::contains).count();
            List<String> gaps = jobSkills.stream()
                    .filter(s -> !studentSkills.contains(s))
                    .map(s -> s.substring(0, 1).toUpperCase() + s.substring(1)) // Capitalize
                    .collect(Collectors.toList());

            int skillMatchScore = jobSkills.isEmpty() ? 0 : (int) ((double) matchCount / jobSkills.size() * 50);
            
            // Location match (30%)
            int locScore = (student.getPreferredLocation() != null && student.getPreferredLocation().equalsIgnoreCase(job.getLocation())) ? 30 : 0;
            
            // Industry match (20%)
            int indScore = (student.getPreferredIndustry() != null && student.getPreferredIndustry().equalsIgnoreCase(job.getIndustry())) ? 20 : 0;

            int totalScore = skillMatchScore + locScore + indScore;

            Recommendation rec = Recommendation.builder()
                    .student(student)
                    .internship(job)
                    .matchScore(totalScore)
                    .skillGap(String.join(", ", gaps))
                    .build();
            
            recommendations.add(recommendationRepository.save(rec));
        }

        // Sort by match score descending
        recommendations.sort((r1, r2) -> r2.getMatchScore().compareTo(r1.getMatchScore()));
        return recommendations;
    }

    public List<Recommendation> getCachedRecommendations(Integer studentId) {
        List<Recommendation> recs = recommendationRepository.findByStudentUserId(studentId);
        if (recs.isEmpty()) {
            // Generate them if empty
            return generateRecommendations(studentId);
        }
        return recs;
    }
}
