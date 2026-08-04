package com.ecotrack.backend.activity.service;

import com.ecotrack.backend.activity.entity.CarbonCalculationHistory;
import com.ecotrack.backend.activity.entity.CarbonEmissionFactor;
import com.ecotrack.backend.activity.repository.CarbonCalculationHistoryRepository;
import com.ecotrack.backend.activity.repository.CarbonEmissionFactorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CarbonCalculationService {

    private final CarbonEmissionFactorRepository emissionFactorRepository;
    private final CarbonCalculationHistoryRepository historyRepository;

    @Transactional
    public CalculationResult calculateAndRecord(String categoryCode, String subCategory, BigDecimal quantity, UUID activityId, Long userId) {
        BigDecimal factorVal = getEmissionFactor(categoryCode, subCategory);
        BigDecimal calculatedCo2 = quantity.multiply(factorVal).setScale(4, RoundingMode.HALF_UP);

        CarbonCalculationHistory history = CarbonCalculationHistory.builder()
                .activityId(activityId)
                .userId(userId)
                .categoryCode(categoryCode)
                .subCategory(subCategory)
                .formulaUsed("Quantity x EmissionFactor (" + quantity + " x " + factorVal + ")")
                .inputQuantity(quantity)
                .factorValue(factorVal)
                .calculatedCo2(calculatedCo2)
                .calculatedAt(LocalDateTime.now())
                .build();

        historyRepository.save(history);
        log.debug("Recorded calculation history for activity {}: {} kg CO2e", activityId, calculatedCo2);

        return new CalculationResult(calculatedCo2, factorVal);
    }

    @Transactional(readOnly = true)
    public BigDecimal getEmissionFactor(String categoryCode, String subCategory) {
        if (subCategory == null || subCategory.trim().isEmpty()) {
            return BigDecimal.ONE;
        }
        return emissionFactorRepository.findFirstByCategoryCodeAndSubCategoryIgnoreCaseAndIsActiveTrue(categoryCode, subCategory)
                .map(CarbonEmissionFactor::getFactorValue)
                .orElseGet(() -> {
                    log.warn("Emission factor not found for category={} subCategory={}, defaulting to 1.0", categoryCode, subCategory);
                    return BigDecimal.ONE;
                });
    }

    public record CalculationResult(BigDecimal calculatedCo2, BigDecimal factorUsed) {}
}
