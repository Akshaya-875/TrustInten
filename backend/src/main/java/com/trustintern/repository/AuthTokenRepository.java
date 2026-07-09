package com.trustintern.repository;

import com.trustintern.model.AuthToken;
import com.trustintern.model.TokenType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AuthTokenRepository extends JpaRepository<AuthToken, Integer> {
    Optional<AuthToken> findByTokenAndTokenType(String token, TokenType tokenType);
    Optional<AuthToken> findByToken(String token);
}
