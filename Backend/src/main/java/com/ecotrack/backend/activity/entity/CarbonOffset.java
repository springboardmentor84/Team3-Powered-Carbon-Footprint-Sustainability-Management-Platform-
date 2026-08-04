package com.ecotrack.backend.activity.entity;

import com.ecotrack.backend.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "carbon_offsets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarbonOffset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "source_category", nullable = false)
    private String sourceCategory; // e.g. TREE_PLANTATION, RECYCLING, RENEWABLE_ENERGY

    @Column(name = "offset_amount_co2", nullable = false, precision = 12, scale = 4)
    private BigDecimal offsetAmountCo2;

    @Column(name = "date_logged", nullable = false)
    private LocalDate dateLogged;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.dateLogged == null) {
            this.dateLogged = LocalDate.now();
        }
    }
}
