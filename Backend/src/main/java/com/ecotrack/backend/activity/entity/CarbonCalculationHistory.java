package com.ecotrack.backend.activity.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "carbon_calculation_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarbonCalculationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "activity_id")
    private UUID activityId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "category_code", nullable = false)
    private String categoryCode;

    @Column(name = "sub_category")
    private String subCategory;

    @Column(name = "formula_used", nullable = false)
    private String formulaUsed;

    @Column(name = "input_quantity", nullable = false, precision = 12, scale = 4)
    private BigDecimal inputQuantity;

    @Column(name = "factor_value", nullable = false, precision = 12, scale = 4)
    private BigDecimal factorValue;

    @Column(name = "calculated_co2", nullable = false, precision = 12, scale = 4)
    private BigDecimal calculatedCo2;

    @Column(name = "calculated_at", nullable = false)
    private LocalDateTime calculatedAt;

    @PrePersist
    public void prePersist() {
        if (this.calculatedAt == null) {
            this.calculatedAt = LocalDateTime.now();
        }
    }
}
