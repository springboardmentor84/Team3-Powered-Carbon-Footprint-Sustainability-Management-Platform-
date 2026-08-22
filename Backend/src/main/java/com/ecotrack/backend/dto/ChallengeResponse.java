package com.ecotrack.backend.dto;

import com.ecotrack.backend.entity.ChallengeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChallengeResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private ChallengeType challengeType;
    private Integer rewardPoints;
    private String badgeName;
    private Integer targetValue;
    private String unit;
    private String rules;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean active;
    private LocalDateTime createdAt;

    // User Context fields
    private Boolean joined;
    private Integer currentProgress;
    private String status;
    private Long participantCount;

    // Creator Context fields
    private Long createdByUserId;
    private String creatorName;
    private Boolean isCreatedByCurrentUser;
}
