package com.ecotrack.backend.activity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarbonActivityCreateRequest {

    @NotBlank(message = "Category code is required")
    private String categoryCode;

    private String subCategory;

    private LocalDate activityDate;

    @NotBlank(message = "Activity name is required")
    private String activityName;

    @NotNull(message = "Quantity is required")
    private BigDecimal quantity;

    @NotBlank(message = "Unit is required")
    private String unit;

    private String detailJson;

    private String notes;

    private Boolean isOffset;
}
