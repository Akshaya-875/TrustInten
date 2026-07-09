package com.trustintern.service;

import com.trustintern.model.AuthToken;
import com.trustintern.model.TokenType;
import com.trustintern.model.User;
import com.trustintern.repository.AuthTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class TokenService {

    @Value("${trustintern.token.email-verification.expiry-ms}")
    private Long emailVerificationExpiryMs;

    @Value("${trustintern.token.password-reset.expiry-ms}")
    private Long passwordResetExpiryMs;

    @Value("${trustintern.jwt.refresh-expiration}")
    private Long refreshTokenExpiryMs;

    @Autowired
    private AuthTokenRepository authTokenRepository;

    @Transactional
    public AuthToken createToken(User user, TokenType type) {
        AuthToken token = AuthToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .tokenType(type)
                .revoked(false)
                .used(false)
                .expiresAt(expiryForType(type))
                .build();
        return authTokenRepository.save(token);
    }

    private LocalDateTime expiryForType(TokenType type) {
        LocalDateTime now = LocalDateTime.now();
        return switch (type) {
            case EMAIL_VERIFICATION -> now.plusNanos(emailVerificationExpiryMs * 1000000);
            case PASSWORD_RESET -> now.plusNanos(passwordResetExpiryMs * 1000000);
            case REFRESH_TOKEN -> now.plusNanos(refreshTokenExpiryMs * 1000000);
        };
    }

    public AuthToken validateToken(String tokenValue, TokenType type) {
        return authTokenRepository.findByTokenAndTokenType(tokenValue, type)
                .filter(authToken -> !authToken.getRevoked())
                .filter(authToken -> !authToken.getUsed())
                .filter(authToken -> authToken.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new RuntimeException("Invalid or expired token."));
    }

    @Transactional
    public void markTokenUsed(AuthToken authToken) {
        authToken.setUsed(true);
        authTokenRepository.save(authToken);
    }

    @Transactional
    public void revokeRefreshToken(String tokenValue) {
        authTokenRepository.findByTokenAndTokenType(tokenValue, TokenType.REFRESH_TOKEN)
                .ifPresent(token -> {
                    token.setRevoked(true);
                    authTokenRepository.save(token);
                });
    }

    @Transactional
    public void revokeUserRefreshTokens(User user) {
        authTokenRepository.findAll().stream()
                .filter(token -> token.getUser().equals(user) && token.getTokenType() == TokenType.REFRESH_TOKEN)
                .forEach(token -> {
                    token.setRevoked(true);
                    authTokenRepository.save(token);
                });
    }

    public boolean isRefreshTokenValid(String tokenValue) {
        return authTokenRepository.findByTokenAndTokenType(tokenValue, TokenType.REFRESH_TOKEN)
                .filter(authToken -> !authToken.getRevoked())
                .filter(authToken -> authToken.getExpiresAt().isAfter(LocalDateTime.now()))
                .isPresent();
    }
}
