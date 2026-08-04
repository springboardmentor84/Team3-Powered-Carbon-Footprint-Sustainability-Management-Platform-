package com.ecotrack.backend.repository;

import com.ecotrack.backend.entity.CarbonEmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CarbonEmissionRepository extends JpaRepository<CarbonEmission, Long> {

    List<CarbonEmission> findByUserId(Long userId);

    List<CarbonEmission> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    // ---- DASHBOARD KE LIYE NAYE FAST (SUM) QUERIES ----

    // Total nikalne ke liye
    @Query("SELECT COALESCE(SUM(c.totalEmission), 0) FROM CarbonEmission c WHERE c.user.id = :userId")
    Double calculateTotalEmissionByUserId(@Param("userId") Long userId);

    // Monthly/Weekly date ke hisaab se total nikalne ke liye
    @Query("SELECT COALESCE(SUM(c.totalEmission), 0) FROM CarbonEmission c WHERE c.user.id = :userId AND c.createdAt >= :startDate")
    Double calculateEmissionSince(@Param("userId") Long userId, @Param("startDate") LocalDateTime startDate);
}