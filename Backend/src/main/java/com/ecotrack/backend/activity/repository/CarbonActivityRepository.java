package com.ecotrack.backend.activity.repository;

import com.ecotrack.backend.activity.entity.CarbonActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface CarbonActivityRepository extends JpaRepository<CarbonActivity, UUID> {
    Page<CarbonActivity> findByUserIdAndDeletedFalseOrderByActivityDateDesc(Long userId, Pageable pageable);
    
    Page<CarbonActivity> findByUserIdAndCategoryCodeIgnoreCaseAndDeletedFalseOrderByActivityDateDesc(Long userId, String categoryCode, Pageable pageable);
    
    List<CarbonActivity> findByUserIdAndDeletedFalse(Long userId);
    
    List<CarbonActivity> findByUserIdAndCategoryCodeIgnoreCaseAndDeletedFalse(Long userId, String categoryCode);

    @Query("SELECT COALESCE(SUM(c.calculatedCo2), 0) FROM CarbonActivity c WHERE c.user.id = :userId AND c.deleted = false AND c.isOffset = false AND c.activityDate = :date")
    BigDecimal sumEmissionsByDate(@Param("userId") Long userId, @Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(c.calculatedCo2), 0) FROM CarbonActivity c WHERE c.user.id = :userId AND c.deleted = false AND c.isOffset = false AND c.activityDate >= :startDate AND c.activityDate <= :endDate")
    BigDecimal sumEmissionsBetweenDates(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(c.calculatedCo2), 0) FROM CarbonActivity c WHERE c.user.id = :userId AND c.deleted = false AND c.isOffset = true")
    BigDecimal sumTotalOffsets(@Param("userId") Long userId);
}
