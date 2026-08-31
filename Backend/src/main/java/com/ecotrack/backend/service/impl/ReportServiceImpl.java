package com.ecotrack.backend.service.impl;

import com.ecotrack.backend.activity.entity.CarbonActivity;
import com.ecotrack.backend.activity.repository.CarbonActivityRepository;
import com.ecotrack.backend.entity.Challenge;
import com.ecotrack.backend.entity.Goal;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.repository.ChallengeRepository;
import com.ecotrack.backend.repository.GoalRepository;
import com.ecotrack.backend.repository.UserRepository;
import com.ecotrack.backend.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final UserRepository userRepository;
    private final CarbonActivityRepository carbonActivityRepository;
    private final GoalRepository goalRepository;
    private final ChallengeRepository challengeRepository;

    @Override
    public Map<String, Object> generateReportData(String userEmail, String reportType, String dateRange) {
        String targetEmail = (userEmail != null && !userEmail.isBlank()) ? userEmail : "demo@ecotrack.com";
        Optional<User> userOpt = userRepository.findByEmail(targetEmail);
        Long userId = userOpt.map(User::getId).orElse(1L);

        LocalDate startDate = calculateStartDate(dateRange);
        LocalDate endDate = LocalDate.now();

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("reportTitle", getReportTitle(reportType));
        report.put("reportType", reportType);
        report.put("dateRange", dateRange);
        report.put("startDate", startDate.toString());
        report.put("endDate", endDate.toString());
        report.put("generatedAt", LocalDate.now().toString());
        report.put("userEmail", targetEmail);

        List<CarbonActivity> allActivities = carbonActivityRepository.findByUserIdAndDeletedFalse(userId);
        List<CarbonActivity> filteredActivities = allActivities.stream()
                .filter(a -> a.getActivityDate() != null &&
                        !a.getActivityDate().isBefore(startDate) &&
                        !a.getActivityDate().isAfter(endDate))
                .collect(Collectors.toList());

        BigDecimal totalEmissions = filteredActivities.stream()
                .filter(a -> Boolean.FALSE.equals(a.getIsOffset()))
                .map(CarbonActivity::getCalculatedCo2)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalOffsets = filteredActivities.stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsOffset()))
                .map(CarbonActivity::getCalculatedCo2)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netScore = totalEmissions.subtract(totalOffsets);

        Map<String, BigDecimal> categoryBreakdown = filteredActivities.stream()
                .filter(a -> Boolean.FALSE.equals(a.getIsOffset()))
                .collect(Collectors.groupingBy(
                        CarbonActivity::getCategoryCode,
                        Collectors.reducing(BigDecimal.ZERO, a -> a.getCalculatedCo2() != null ? a.getCalculatedCo2() : BigDecimal.ZERO, BigDecimal::add)
                ));

        report.put("recordCount", filteredActivities.size());
        report.put("totalEmissionsKg", totalEmissions);
        report.put("totalOffsetsKg", totalOffsets);
        report.put("netCarbonScoreKg", netScore);
        report.put("categoryBreakdown", categoryBreakdown);

        List<Goal> userGoals = goalRepository.findByUserEmail(targetEmail);
        report.put("goalCount", userGoals.size());
        report.put("completedGoals", userGoals.stream().filter(g -> "Completed".equalsIgnoreCase(g.getStatus())).count());

        List<Challenge> challenges = challengeRepository.findAll();
        report.put("challengeCount", challenges.size());

        List<Map<String, Object>> recordsList = filteredActivities.stream().map(a -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", a.getId() != null ? a.getId().toString() : "");
            m.put("date", a.getActivityDate() != null ? a.getActivityDate().toString() : "");
            m.put("name", a.getActivityName());
            m.put("category", a.getCategoryCode());
            m.put("subCategory", a.getSubCategory());
            m.put("quantity", a.getQuantity());
            m.put("unit", a.getUnit());
            m.put("factor", a.getEmissionFactorUsed());
            m.put("co2Kg", a.getCalculatedCo2());
            m.put("isOffset", a.getIsOffset());
            return m;
        }).collect(Collectors.toList());

        report.put("activities", recordsList);
        return report;
    }

    @Override
    public byte[] generateReportExport(String userEmail, String reportType, String dateRange, String format) {
        Map<String, Object> data = generateReportData(userEmail, reportType, dateRange);

        if ("excel".equalsIgnoreCase(format) || "csv".equalsIgnoreCase(format)) {
            return generateCsvExport(data);
        } else {
            return generatePdfTextExport(data);
        }
    }

    private byte[] generateCsvExport(Map<String, Object> data) {
        StringBuilder sb = new StringBuilder();
        // Add UTF-8 BOM for Excel
        sb.append("\uFEFF");
        sb.append("EcoTrack Sustainability Management Platform - Report Export\n");
        sb.append("Report Title:,").append(escapeCsv(String.valueOf(data.get("reportTitle")))).append("\n");
        sb.append("Generated For:,").append(escapeCsv(String.valueOf(data.get("userEmail")))).append("\n");
        sb.append("Date Range:,").append(escapeCsv(String.valueOf(data.get("dateRange")))).append(" (").append(data.get("startDate")).append(" to ").append(data.get("endDate")).append(")\n");
        sb.append("Generated At:,").append(data.get("generatedAt")).append("\n\n");

        sb.append("Executive Metrics Summary\n");
        sb.append("Total Gross Emissions (kg CO2e):,").append(data.get("totalEmissionsKg")).append("\n");
        sb.append("Total Offsets (kg CO2e):,").append(data.get("totalOffsetsKg")).append("\n");
        sb.append("Net Carbon Footprint (kg CO2e):,").append(data.get("netCarbonScoreKg")).append("\n");
        sb.append("Total Records Filtered:,").append(data.get("recordCount")).append("\n\n");

        sb.append("Itemized Activity Records\n");
        sb.append("Date,Activity Name,Category,SubCategory,Quantity,Unit,Factor Used,Calculated CO2e (kg),Is Offset\n");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> activities = (List<Map<String, Object>>) data.get("activities");
        if (activities != null) {
            for (Map<String, Object> a : activities) {
                sb.append(escapeCsv(String.valueOf(a.get("date")))).append(",");
                sb.append(escapeCsv(String.valueOf(a.get("name")))).append(",");
                sb.append(escapeCsv(String.valueOf(a.get("category")))).append(",");
                sb.append(escapeCsv(String.valueOf(a.get("subCategory")))).append(",");
                sb.append(a.get("quantity")).append(",");
                sb.append(escapeCsv(String.valueOf(a.get("unit")))).append(",");
                sb.append(a.get("factor")).append(",");
                sb.append(a.get("co2Kg")).append(",");
                sb.append(a.get("isOffset")).append("\n");
            }
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] generatePdfTextExport(Map<String, Object> data) {
        StringBuilder sb = new StringBuilder();
        sb.append("===============================================================\n");
        sb.append("             ECOTRACK SUSTAINABILITY REPORT                  \n");
        sb.append("===============================================================\n\n");
        sb.append("TITLE:       ").append(data.get("reportTitle")).append("\n");
        sb.append("USER:        ").append(data.get("userEmail")).append("\n");
        sb.append("DATE RANGE:  ").append(data.get("dateRange")).append(" (").append(data.get("startDate")).append(" to ").append(data.get("endDate")).append(")\n");
        sb.append("GENERATED:   ").append(data.get("generatedAt")).append("\n");
        sb.append("AUDIT REF:   ECO-AUDIT-").append(System.currentTimeMillis()).append("\n\n");

        sb.append("---------------------------------------------------------------\n");
        sb.append("EXECUTIVE SUMMARY KEY PERFORMANCE INDICATORS\n");
        sb.append("---------------------------------------------------------------\n");
        sb.append("Gross Carbon Emissions:  ").append(data.get("totalEmissionsKg")).append(" kg CO2e\n");
        sb.append("Carbon Offsets:          ").append(data.get("totalOffsetsKg")).append(" kg CO2e\n");
        sb.append("Net Carbon Score:        ").append(data.get("netCarbonScoreKg")).append(" kg CO2e\n");
        sb.append("Activities Analyzed:     ").append(data.get("recordCount")).append("\n\n");

        sb.append("---------------------------------------------------------------\n");
        sb.append("ITEMIZED ACTIVITY AUDIT LOGS\n");
        sb.append("---------------------------------------------------------------\n");
        sb.append(String.format("%-12s %-25s %-18s %-10s %-10s\n", "DATE", "ACTIVITY", "CATEGORY", "QTY", "CO2e (kg)"));
        sb.append("---------------------------------------------------------------\n");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> activities = (List<Map<String, Object>>) data.get("activities");
        if (activities != null) {
            for (Map<String, Object> a : activities) {
                String date = String.valueOf(a.get("date"));
                String name = String.valueOf(a.get("name"));
                if (name.length() > 24) name = name.substring(0, 21) + "...";
                String cat = String.valueOf(a.get("category"));
                String qty = String.valueOf(a.get("quantity")) + " " + a.get("unit");
                String co2 = String.valueOf(a.get("co2Kg"));
                sb.append(String.format("%-12s %-25s %-18s %-10s %-10s\n", date, name, cat, qty, co2));
            }
        }

        sb.append("\n===============================================================\n");
        sb.append("         OFFICIAL ECOTRACK ESG CERTIFICATION SEAL             \n");
        sb.append("===============================================================\n");

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private LocalDate calculateStartDate(String dateRange) {
        if ("last-7".equalsIgnoreCase(dateRange)) {
            return LocalDate.now().minusDays(7);
        } else if ("last-12m".equalsIgnoreCase(dateRange)) {
            return LocalDate.now().minusMonths(12);
        } else if ("ytd".equalsIgnoreCase(dateRange)) {
            return LocalDate.of(LocalDate.now().getYear(), 1, 1);
        } else {
            // default last-30
            return LocalDate.now().minusDays(30);
        }
    }

    private String getReportTitle(String type) {
        if ("goals".equalsIgnoreCase(type)) return "Goal Achievement Tracker";
        if ("sustainability".equalsIgnoreCase(type)) return "General Sustainability Scorecard";
        if ("challenges".equalsIgnoreCase(type)) return "Community Challenge Summary";
        return "Carbon Footprint Analysis";
    }

    private String escapeCsv(String input) {
        if (input == null) return "";
        if (input.contains(",") || input.contains("\"") || input.contains("\n")) {
            return "\"" + input.replace("\"", "\"\"") + "\"";
        }
        return input;
    }
}
