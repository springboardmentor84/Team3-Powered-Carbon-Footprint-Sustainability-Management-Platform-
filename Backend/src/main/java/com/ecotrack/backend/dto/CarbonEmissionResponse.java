package com.ecotrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarbonEmissionResponse {
    private Long id;
    private Long userId;
    private BigDecimal transportationEmission;
    private BigDecimal electricityEmission;
    private BigDecimal foodEmission;
    private BigDecimal wasteEmission;
    private BigDecimal totalEmission;
    private LocalDateTime createdAt;
}
