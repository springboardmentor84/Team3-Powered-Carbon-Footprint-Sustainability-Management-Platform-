package com.ecotrack.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarbonEmissionRequest {

    @NotNull(message = "Transportation emission is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Transportation emission cannot be negative")
    private BigDecimal transportationEmission;

    @NotNull(message = "Electricity emission is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Electricity emission cannot be negative")
    private BigDecimal electricityEmission;

    @NotNull(message = "Food emission is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Food emission cannot be negative")
    private BigDecimal foodEmission;

    @NotNull(message = "Waste emission is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Waste emission cannot be negative")
    private BigDecimal wasteEmission;
}
