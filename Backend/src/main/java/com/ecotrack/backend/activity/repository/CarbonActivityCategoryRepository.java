package com.ecotrack.backend.activity.repository;

import com.ecotrack.backend.activity.entity.CarbonActivityCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CarbonActivityCategoryRepository extends JpaRepository<CarbonActivityCategory, Long> {
    Optional<CarbonActivityCategory> findByCode(String code);
}
