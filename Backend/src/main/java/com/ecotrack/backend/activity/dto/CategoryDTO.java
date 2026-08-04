package com.ecotrack.backend.activity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryDTO {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String icon;
    private String defaultUnit;
    private Boolean isOffset;
    private List<EmissionFactorDTO> emissionFactors;
}
