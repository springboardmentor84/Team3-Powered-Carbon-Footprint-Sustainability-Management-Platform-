package com.ecotrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "carbon_emissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarbonEmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "transportation_emission", nullable = false)
    private BigDecimal transportationEmission;

    @Column(name = "electricity_emission", nullable = false)
    private BigDecimal electricityEmission;

    @Column(name = "food_emission", nullable = false)
    private BigDecimal foodEmission;

    @Column(name = "waste_emission", nullable = false)
    private BigDecimal wasteEmission;

    @Column(name = "total_emission", nullable = false)
    private BigDecimal totalEmission;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        calculateTotalEmission();
    }

    @PreUpdate
    public void preUpdate() {
        calculateTotalEmission();
    }

    public void calculateTotalEmission() {
        if (transportationEmission == null) {
            transportationEmission = BigDecimal.ZERO;
        }
        if (electricityEmission == null) {
            electricityEmission = BigDecimal.ZERO;
        }
        if (foodEmission == null) {
            foodEmission = BigDecimal.ZERO;
        }
        if (wasteEmission == null) {
            wasteEmission = BigDecimal.ZERO;
        }

        this.totalEmission = transportationEmission
                .add(electricityEmission)
                .add(foodEmission)
                .add(wasteEmission);
    }
}
