package com.ecotrack.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChallengeRequest {

    @NotBlank(message = "Challenge title is required")
    private String title;

    private String category;

    @NotBlank(message = "Description is required")
    private String description;

    private LocalDate startDate;
    private LocalDate endDate;

    @NotNull(message = "Target value is required")
    @Min(value = 1, message = "Target value must be at least 1")
    private Integer targetValue;

    private String unit;

    @NotNull(message = "Reward points are required")
    @Min(value = 0, message = "Reward points must be non-negative")
    private Integer rewardPoints;

    private String rules;
}
