package com.trustintern.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String jwtToken;
    private String refreshToken;
    private Integer userId;
    private String username;
    private String role;
    private Boolean emailVerified;
}
