package com.trustintern.blockchain;

import jakarta.persistence.*;
import lombok.*;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

@Entity
@Table(name = "blockchain")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Block {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "block_number")
    private Integer blockNumber;

    @Column(name = "certificate_id", nullable = false)
    private String certificateId;

    @Column(name = "student_id", nullable = false)
    private Integer studentId;

    @Column(name = "certificate_hash", nullable = false, length = 64)
    private String certificateHash;

    @Column(name = "previous_hash", nullable = false, length = 64)
    private String previousHash;

    @Column(name = "current_hash", nullable = false, length = 64)
    private String currentHash;

    @Column(name = "timestamp", nullable = false)
    private Long timestamp;

    public String calculateHash() {
        // Concatenate parameters to compute current block hash
        String dataToHash = (blockNumber != null ? blockNumber.toString() : "") 
                + certificateId 
                + studentId 
                + certificateHash 
                + previousHash 
                + timestamp;
        return applySha256(dataToHash);
    }

    public static String applySha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 encryption failed", e);
        }
    }
}
