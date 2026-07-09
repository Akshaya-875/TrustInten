package com.trustintern.repository;

import com.trustintern.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Integer> {
    List<Application> findByStudentUserId(Integer studentId);
    List<Application> findByInternshipId(Integer internshipId);
    List<Application> findByInternshipRecruiterUserId(Integer recruiterId);
    boolean existsByInternshipIdAndStudentUserId(Integer internshipId, Integer studentId);
}
