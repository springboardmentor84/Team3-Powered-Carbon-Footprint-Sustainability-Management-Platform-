package com.ecotrack.backend.activity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmissionFactorDTO {
    private Long id;
    private String categoryCode;
    private String subCategory;
    private BigDecimal factorValue;
    private String unit;
    private String region;
}
