package com.ecotrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private String message;
    private String email;
    private Long id;
    private String fullName;
    private Integer rewardPoints;
    private String badgeName;
    private String role;
    private String location;
    private String environmentalInterests;
    private String lifestyleConfig;
}