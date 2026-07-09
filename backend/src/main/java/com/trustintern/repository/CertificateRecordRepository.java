package com.trustintern.repository;

import com.trustintern.model.CertificateRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CertificateRecordRepository extends JpaRepository<CertificateRecord, Integer> {
    Optional<CertificateRecord> findByCertificateId(String certificateId);
    Optional<CertificateRecord> findByRegisterNumber(String registerNumber);
}
