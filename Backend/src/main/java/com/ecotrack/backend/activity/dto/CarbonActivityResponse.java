package com.ecotrack.backend.activity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarbonActivityResponse {
    private UUID id;
    private Long userId;
    private String categoryCode;
    private String subCategory;
    private LocalDate activityDate;
    private String activityName;
    private BigDecimal quantity;
    private String unit;
    private String detailJson;
    private BigDecimal calculatedCo2;
    private BigDecimal emissionFactorUsed;
    private String notes;
    private Boolean isOffset;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
