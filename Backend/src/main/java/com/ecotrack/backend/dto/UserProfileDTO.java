package com.ecotrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {
    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String dateOfBirth;
    private String gender;
    private String bio;
    private String organization;
    private String employeeId;
    private String location;
    private String profileImage;
    private String role;
    private Integer rewardPoints;
    private String badgeName;

    private String environmentalInterests;
    private String sustainabilityPreferences;
    private String personalGoals;
    private String lifestyleConfig;

    private Integer completionPercentage;
    private List<String> missingFields;
}
