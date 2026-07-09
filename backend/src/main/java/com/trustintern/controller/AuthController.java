package com.trustintern.controller;

import com.trustintern.dto.*;
import com.trustintern.model.*;
import com.trustintern.repository.*;
import com.trustintern.security.JwtTokenUtil;
import com.trustintern.service.EmailService;
import com.trustintern.service.TokenService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.HashSet;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private RecruiterRepository recruiterRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private EmailService emailService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username is already taken."));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is already in use."));
        }

        String role = signUpRequest.getRole();
        if (role == null || (!role.equals("ROLE_STUDENT") && !role.equals("ROLE_RECRUITER"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role specified. Must be ROLE_STUDENT or ROLE_RECRUITER."));
        }

        User user = User.builder()
                .username(signUpRequest.getUsername())
                .email(signUpRequest.getEmail())
                .emailVerified(false)
                .password(passwordEncoder.encode(signUpRequest.getPassword()))
                .role(role)
                .build();

        user = userRepository.saveAndFlush(user);

        if (role.equals("ROLE_STUDENT")) {
            Student student = Student.builder()
                    .user(user)
                    .fullName(signUpRequest.getFullName() != null ? signUpRequest.getFullName() : signUpRequest.getUsername())
                    .verificationStatus("PENDING")
                    .cgpa(0.00)
                    .skills(new HashSet<>())
                    .build();
            studentRepository.saveAndFlush(student);
        } else {
            Recruiter recruiter = Recruiter.builder()
                    .user(user)
                    .companyName(signUpRequest.getCompanyName() != null ? signUpRequest.getCompanyName() : signUpRequest.getUsername() + " Corp")
                    .build();
            recruiterRepository.saveAndFlush(recruiter);
        }

        AuthToken emailToken = tokenService.createToken(user, TokenType.EMAIL_VERIFICATION);
        emailService.sendVerificationEmail(user, emailToken.getToken());

        return ResponseEntity.ok(Map.of("message", "User registered successfully. A verification link has been sent to your email address."));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        final UserDetails userDetails = userDetailsService.loadUserByUsername(loginRequest.getUsername());
        final String jwt = jwtTokenUtil.generateToken(userDetails);
        final User user = userRepository.findByUsername(loginRequest.getUsername()).orElseThrow();
        final AuthToken refreshToken = tokenService.createToken(user, TokenType.REFRESH_TOKEN);

        return ResponseEntity.ok(new LoginResponse(jwt, refreshToken.getToken(), user.getId(), user.getUsername(), user.getRole(), user.getEmailVerified()));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("No account found for the provided email."));

        AuthToken resetToken = tokenService.createToken(user, TokenType.PASSWORD_RESET);
        emailService.sendPasswordResetEmail(user, resetToken.getToken());

        return ResponseEntity.ok(Map.of("message", "Password reset instructions have been sent to your email."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        AuthToken resetToken = tokenService.validateToken(request.getToken(), TokenType.PASSWORD_RESET);
        User user = resetToken.getUser();

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        tokenService.markTokenUsed(resetToken);
        tokenService.revokeUserRefreshTokens(user);

        return ResponseEntity.ok(Map.of("message", "Password reset successfully."));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        AuthToken verificationToken = tokenService.validateToken(token, TokenType.EMAIL_VERIFICATION);
        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
        tokenService.markTokenUsed(verificationToken);

        return ResponseEntity.ok(Map.of("message", "Email verified successfully."));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthToken refreshToken = tokenService.validateToken(request.getRefreshToken(), TokenType.REFRESH_TOKEN);
        User user = refreshToken.getUser();

        final UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        final String jwt = jwtTokenUtil.generateToken(userDetails);

        return ResponseEntity.ok(Map.of(
                "jwtToken", jwt,
                "refreshToken", refreshToken.getToken(),
                "role", user.getRole(),
                "emailVerified", user.getEmailVerified()
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@Valid @RequestBody RefreshTokenRequest request) {
        tokenService.revokeRefreshToken(request.getRefreshToken());
        return ResponseEntity.ok(Map.of("message", "Logged out successfully."));
    }
}
