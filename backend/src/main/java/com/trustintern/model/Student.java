package com.trustintern.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "students")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"user", "skills"})
@EqualsAndHashCode(exclude = {"user", "skills"})
public class Student {
    
    @Id
    @Column(name = "user_id")
    private Integer userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "profile_photo")
    private String profilePhoto;

    @Column(name = "resume_path")
    private String resumePath;

    @Column(name = "resume_text", columnDefinition = "TEXT")
    private String resumeText;

    @Column(name = "degree_certificate_path")
    private String degreeCertificatePath;

    @Column(name = "mark_sheets_path")
    private String markSheetsPath;

    @Column(name = "skill_certificates_path")
    private String skillCertificatesPath;

    @Column(name = "verification_status", length = 20)
    private String verificationStatus; // PENDING, VERIFIED, FAKE, TAMPERED

    private Double cgpa;

    @Column(name = "preferred_location", length = 100)
    private String preferredLocation;

    @Column(name = "preferred_industry", length = 100)
    private String preferredIndustry;

    @Column(columnDefinition = "TEXT")
    private String projects;

    @Column(columnDefinition = "TEXT")
    private String certifications;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "student_skills",
        joinColumns = @JoinColumn(name = "student_id"),
        inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    private Set<Skill> skills;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
