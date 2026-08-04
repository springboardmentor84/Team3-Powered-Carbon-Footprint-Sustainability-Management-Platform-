package com.ecotrack.backend.activity.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "carbon_emission_factors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarbonEmissionFactor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "category_code", nullable = false)
    private String categoryCode;

    @Column(name = "sub_category", nullable = false)
    private String subCategory; // e.g. CAR_PETROL, EV, LPG, MEAT_MEAL, PLASTIC

    @Column(name = "factor_value", nullable = false, precision = 12, scale = 4)
    private BigDecimal factorValue; // kg CO2e per unit

    @Column(name = "unit", nullable = false)
    private String unit;

    @Column(name = "region")
    private String region;

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
        if (this.isActive == null) {
            this.isActive = true;
        }
        if (this.region == null) {
            this.region = "GLOBAL";
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
