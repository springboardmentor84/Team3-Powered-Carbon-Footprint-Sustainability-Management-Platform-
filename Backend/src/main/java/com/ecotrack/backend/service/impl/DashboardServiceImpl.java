package com.ecotrack.backend.service.impl;

import com.ecotrack.backend.dto.DashboardResponse;
import com.ecotrack.backend.entity.CarbonEmission;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.exception.ResourceNotFoundException;
import com.ecotrack.backend.repository.CarbonEmissionRepository;
import com.ecotrack.backend.repository.UserRepository;
import com.ecotrack.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final CarbonEmissionRepository carbonEmissionRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(String authenticatedEmail) {
        User user = userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<CarbonEmission> emissions = carbonEmissionRepository.findByUserId(user.getId());

        if (emissions.isEmpty()) {
            return DashboardResponse.builder()
                    .totalCarbonEmission(BigDecimal.ZERO)
                    .monthlyEmission(BigDecimal.ZERO)
                    .weeklyEmission(BigDecimal.ZERO)
                    .dailyEmission(BigDecimal.ZERO)
                    .highestEmissionCategory("N/A")
                    .lowestEmissionCategory("N/A")
                    .build();
        }

        LocalDate today = LocalDate.now();
        LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = today.with(TemporalAdjusters.lastDayOfMonth()).atTime(LocalTime.MAX);

        LocalDate startOfWeekDate = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate endOfWeekDate = startOfWeekDate.plusDays(6);
        LocalDateTime startOfWeek = startOfWeekDate.atStartOfDay();
        LocalDateTime endOfWeek = endOfWeekDate.atTime(LocalTime.MAX);

        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);

        BigDecimal totalCarbonEmission = sumTotalEmissions(emissions);
        BigDecimal monthlyEmission = sumEmissionsInRange(emissions, startOfMonth, endOfMonth);
        BigDecimal weeklyEmission = sumEmissionsInRange(emissions, startOfWeek, endOfWeek);
        BigDecimal dailyEmission = sumEmissionsInRange(emissions, startOfDay, endOfDay);

        Map<String, BigDecimal> categoryTotals = new LinkedHashMap<>();
        categoryTotals.put("TRANSPORTATION", sumCategory(emissions, CarbonEmission::getTransportationEmission));
        categoryTotals.put("ELECTRICITY", sumCategory(emissions, CarbonEmission::getElectricityEmission));
        categoryTotals.put("FOOD", sumCategory(emissions, CarbonEmission::getFoodEmission));
        categoryTotals.put("WASTE", sumCategory(emissions, CarbonEmission::getWasteEmission));

        Map.Entry<String, BigDecimal> highestEntry = categoryTotals.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .orElse(Map.entry("N/A", BigDecimal.ZERO));

        Map.Entry<String, BigDecimal> lowestEntry = categoryTotals.entrySet().stream()
                .min(Map.Entry.comparingByValue())
                .orElse(Map.entry("N/A", BigDecimal.ZERO));

        return DashboardResponse.builder()
                .totalCarbonEmission(totalCarbonEmission)
                .monthlyEmission(monthlyEmission)
                .weeklyEmission(weeklyEmission)
                .dailyEmission(dailyEmission)
                .highestEmissionCategory(highestEntry.getKey())
                .lowestEmissionCategory(lowestEntry.getKey())
                .build();
    }

    private BigDecimal sumTotalEmissions(List<CarbonEmission> emissions) {
        return emissions.stream()
                .map(CarbonEmission::getTotalEmission)
                .filter(value -> value != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumEmissionsInRange(List<CarbonEmission> emissions, LocalDateTime startDate, LocalDateTime endDate) {
        return emissions.stream()
                .filter(emission -> emission.getCreatedAt() != null)
                .filter(emission -> !emission.getCreatedAt().isBefore(startDate))
                .filter(emission -> !emission.getCreatedAt().isAfter(endDate))
                .map(CarbonEmission::getTotalEmission)
                .filter(value -> value != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumCategory(List<CarbonEmission> emissions, java.util.function.Function<CarbonEmission, BigDecimal> extractor) {
        return emissions.stream()
                .map(extractor)
                .filter(value -> value != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
