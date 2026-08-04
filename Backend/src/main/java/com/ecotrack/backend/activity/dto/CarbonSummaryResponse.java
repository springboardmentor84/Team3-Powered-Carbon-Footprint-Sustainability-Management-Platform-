package com.ecotrack.backend.activity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarbonSummaryResponse {
    private BigDecimal todayEmission;
    private BigDecimal monthlyEmission;
    private BigDecimal yearlyEmission;
    private BigDecimal totalOffsets;
    private Integer netCarbonScore;
    private Map<String, BigDecimal> categoryBreakdown;
}
