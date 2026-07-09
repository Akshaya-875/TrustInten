package com.trustintern.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "certificate_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CertificateRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "certificate_id", nullable = false, unique = true, length = 50)
    private String certificateId;

    @Column(name = "student_name", nullable = false, length = 100)
    private String studentName;

    @Column(name = "register_number", nullable = false, length = 50)
    private String registerNumber;

    @ManyToOne
    @JoinColumn(name = "university_id")
    private University university;

    @Column(nullable = false, length = 100)
    private String degree;

    @Column(nullable = false)
    private Double cgpa;

    @Column(name = "certificate_hash", nullable = false, length = 64)
    private String certificateHash;
}
