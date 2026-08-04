package com.ecotrack.backend.activity.repository;

import com.ecotrack.backend.activity.entity.CarbonEmissionFactor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarbonEmissionFactorRepository extends JpaRepository<CarbonEmissionFactor, Long> {
    Optional<CarbonEmissionFactor> findFirstByCategoryCodeAndSubCategoryIgnoreCaseAndIsActiveTrue(String categoryCode, String subCategory);
    List<CarbonEmissionFactor> findByCategoryCodeAndIsActiveTrue(String categoryCode);
    List<CarbonEmissionFactor> findByIsActiveTrue();
}
