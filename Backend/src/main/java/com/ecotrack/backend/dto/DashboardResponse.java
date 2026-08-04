package com.ecotrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private BigDecimal totalCarbonEmission;
    private BigDecimal monthlyEmission;
    private BigDecimal weeklyEmission;
    private BigDecimal dailyEmission;
    private String highestEmissionCategory;
    private String lowestEmissionCategory;
}
