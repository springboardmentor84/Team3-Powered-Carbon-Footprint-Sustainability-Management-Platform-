package com.ecotrack.backend.activity.repository;

import com.ecotrack.backend.activity.entity.CarbonCalculationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CarbonCalculationHistoryRepository extends JpaRepository<CarbonCalculationHistory, Long> {
    List<CarbonCalculationHistory> findByActivityId(UUID activityId);
    List<CarbonCalculationHistory> findByUserIdOrderByCalculatedAtDesc(Long userId);
}
