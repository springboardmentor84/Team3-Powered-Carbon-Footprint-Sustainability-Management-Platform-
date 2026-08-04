package com.ecotrack.backend.activity.entity;

import com.ecotrack.backend.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "carbon_activities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarbonActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "category_code", nullable = false)
    private String categoryCode;

    @Column(name = "sub_category")
    private String subCategory;

    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;

    @Column(name = "activity_name", nullable = false)
    private String activityName;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 4)
    private BigDecimal quantity;

    @Column(name = "unit", nullable = false)
    private String unit;

    @Column(name = "detail_json", columnDefinition = "TEXT")
    private String detailJson;

    @Column(name = "calculated_co2", nullable = false, precision = 12, scale = 4)
    private BigDecimal calculatedCo2;

    @Column(name = "emission_factor_used", precision = 12, scale = 4)
    private BigDecimal emissionFactorUsed;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_offset", nullable = false)
    private Boolean isOffset;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
    private String updatedBy;

    @Column(name = "deleted", nullable = false)
    private Boolean deleted;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
        if (this.deleted == null) {
            this.deleted = false;
        }
        if (this.isOffset == null) {
            this.isOffset = false;
        }
        if (this.activityDate == null) {
            this.activityDate = LocalDate.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
