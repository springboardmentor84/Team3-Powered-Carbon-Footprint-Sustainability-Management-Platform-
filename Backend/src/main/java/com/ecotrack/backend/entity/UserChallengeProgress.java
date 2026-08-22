package com.ecotrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_challenge_progress", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_challenge_progress", columnNames = {"user_id", "challenge_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserChallengeProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "challenge_id", nullable = false)
    private Challenge challenge;

    @Builder.Default
    @Column(nullable = false)
    private Integer currentProgress = 0;

    @Builder.Default
    @Column(nullable = false)
    private String status = "In Progress";

    @Column(nullable = true)
    private LocalDateTime completedAt;

    @Column(nullable = true)
    private Integer rewardPointsEarned;

    @Column(nullable = true)
    private String badgeEarned;

    @Column(nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    @PreUpdate
    public void prePersist() {
        if (joinedAt == null) {
            joinedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "In Progress";
        }
        if (currentProgress == null) {
            currentProgress = 0;
        }
        if (completedAt == null) {
            completedAt = LocalDateTime.now();
        }
        if (rewardPointsEarned == null) {
            rewardPointsEarned = 0;
        }
        if (badgeEarned == null) {
            badgeEarned = "None";
        }
    }
}
