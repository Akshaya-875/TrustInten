package com.trustintern.service;

import com.trustintern.model.User;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    public void sendVerificationEmail(User user, String verificationToken) {
        String verificationLink = "http://localhost:5173/verify-email?token=" + verificationToken;
        System.out.println("[EmailService] Verification email sent to " + user.getEmail() + ": " + verificationLink);
    }

    public void sendPasswordResetEmail(User user, String resetToken) {
        String resetLink = "http://localhost:5173/reset-password?token=" + resetToken;
        System.out.println("[EmailService] Password reset email sent to " + user.getEmail() + ": " + resetLink);
    }
}
