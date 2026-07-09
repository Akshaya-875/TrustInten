package com.trustintern.repository;

import com.trustintern.model.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, Integer> {
    List<Recommendation> findByStudentUserId(Integer studentId);
    void deleteByStudentUserId(Integer studentId);
}
