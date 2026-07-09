package com.trustintern.repository;

import com.trustintern.model.Internship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InternshipRepository extends JpaRepository<Internship, Integer> {
    List<Internship> findByStatus(String status);
    List<Internship> findByRecruiterUserId(Integer recruiterId);
}
