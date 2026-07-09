package com.trustintern.repository;

import com.trustintern.model.University;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UniversityRepository extends JpaRepository<University, Integer> {
    Optional<University> findByName(String name);
    Optional<University> findByCode(String code);
}
