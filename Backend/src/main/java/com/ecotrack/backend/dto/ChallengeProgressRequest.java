package com.ecotrack.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChallengeProgressRequest {

    @NotNull(message = "Progress value is required")
    @Min(value = 0, message = "Progress value cannot be negative")
    private Integer currentProgress;
}
