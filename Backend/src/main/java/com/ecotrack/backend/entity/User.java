package com.ecotrack.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Builder.Default
    @Column(nullable = false)
    private Integer rewardPoints = 0;

    @Builder.Default
    @Column(nullable = false)
    private String badgeName = "Bronze";

    @Builder.Default
    @Column(columnDefinition = "varchar(255) default 'ROLE_USER'")
    private String role = "ROLE_USER";

    @Column
    private String location;

    @Column(length = 1000)
    private String environmentalInterests;

    @Column(length = 1000)
    private String lifestyleConfig;

    @Column(length = 500)
    private String profileImage;
}