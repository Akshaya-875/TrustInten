package com.trustintern.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "internships")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"recruiter", "skills"})
@EqualsAndHashCode(exclude = {"recruiter", "skills"})
public class Internship {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "recruiter_id", nullable = false)
    private Recruiter recruiter;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(nullable = false, length = 100)
    private String location;

    @Column(nullable = false, length = 100)
    private String industry;

    private Double salary;

    @Column(nullable = false, length = 20)
    private String status; // OPEN, CLOSED

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "internship_skills",
        joinColumns = @JoinColumn(name = "internship_id"),
        inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    private Set<Skill> skills;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
