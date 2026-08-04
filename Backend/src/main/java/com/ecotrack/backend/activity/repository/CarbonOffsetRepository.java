package com.ecotrack.backend.activity.repository;

import com.ecotrack.backend.activity.entity.CarbonOffset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CarbonOffsetRepository extends JpaRepository<CarbonOffset, Long> {
    List<CarbonOffset> findByUserIdOrderByDateLoggedDesc(Long userId);
}
