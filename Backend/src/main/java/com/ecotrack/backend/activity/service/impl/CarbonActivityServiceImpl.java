package com.ecotrack.backend.activity.service.impl;

import com.ecotrack.backend.activity.dto.*;
import com.ecotrack.backend.activity.entity.*;
import com.ecotrack.backend.activity.repository.*;
import com.ecotrack.backend.activity.service.CarbonActivityService;
import com.ecotrack.backend.activity.service.CarbonCalculationService;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.exception.ResourceNotFoundException;
import com.ecotrack.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CarbonActivityServiceImpl implements CarbonActivityService {

    private final CarbonActivityRepository activityRepository;
    private final CarbonActivityCategoryRepository categoryRepository;
    private final CarbonEmissionFactorRepository factorRepository;
    private final CarbonOffsetRepository offsetRepository;
    private final CarbonCalculationService calculationService;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CarbonActivityResponse createActivity(CarbonActivityCreateRequest request, String authenticatedEmail) {
        User user = findUserByEmail(authenticatedEmail);

        CarbonActivity activity = CarbonActivity.builder()
                .user(user)
                .categoryCode(request.getCategoryCode())
                .subCategory(request.getSubCategory())
                .activityDate(request.getActivityDate() != null ? request.getActivityDate() : LocalDate.now())
                .activityName(request.getActivityName())
                .quantity(request.getQuantity())
                .unit(request.getUnit())
                .detailJson(request.getDetailJson())
                .notes(request.getNotes())
                .isOffset(Boolean.TRUE.equals(request.getIsOffset()))
                .calculatedCo2(BigDecimal.ZERO)
                .deleted(false)
                .createdBy(user.getEmail())
                .build();

        activity = activityRepository.save(activity);

        // Run calculation engine
        var calcResult = calculationService.calculateAndRecord(
                request.getCategoryCode(),
                request.getSubCategory(),
                request.getQuantity(),
                activity.getId(),
                user.getId()
        );

        activity.setCalculatedCo2(calcResult.calculatedCo2());
        activity.setEmissionFactorUsed(calcResult.factorUsed());
        activity = activityRepository.save(activity);

        // If it is an offset category, log in carbon_offsets table
        if (Boolean.TRUE.equals(request.getIsOffset())) {
            CarbonOffset offset = CarbonOffset.builder()
                    .user(user)
                    .sourceCategory(request.getCategoryCode())
                    .offsetAmountCo2(calcResult.calculatedCo2())
                    .dateLogged(activity.getActivityDate())
                    .notes(request.getNotes())
                    .build();
            offsetRepository.save(offset);
        }

        return mapToResponse(activity);
    }

    @Override
    @Transactional
    public CarbonActivityResponse updateActivity(UUID id, CarbonActivityCreateRequest request, String authenticatedEmail) {
        User user = findUserByEmail(authenticatedEmail);
        CarbonActivity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));

        if (!activity.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Activity not found");
        }

        activity.setCategoryCode(request.getCategoryCode());
        activity.setSubCategory(request.getSubCategory());
        if (request.getActivityDate() != null) {
            activity.setActivityDate(request.getActivityDate());
        }
        activity.setActivityName(request.getActivityName());
        activity.setQuantity(request.getQuantity());
        activity.setUnit(request.getUnit());
        activity.setDetailJson(request.getDetailJson());
        activity.setNotes(request.getNotes());
        activity.setIsOffset(Boolean.TRUE.equals(request.getIsOffset()));
        activity.setUpdatedBy(user.getEmail());

        var calcResult = calculationService.calculateAndRecord(
                request.getCategoryCode(),
                request.getSubCategory(),
                request.getQuantity(),
                activity.getId(),
                user.getId()
        );

        activity.setCalculatedCo2(calcResult.calculatedCo2());
        activity.setEmissionFactorUsed(calcResult.factorUsed());
        activity = activityRepository.save(activity);

        return mapToResponse(activity);
    }

    @Override
    @Transactional
    public void deleteActivity(UUID id, String authenticatedEmail) {
        User user = findUserByEmail(authenticatedEmail);
        CarbonActivity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));

        if (!activity.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Activity not found");
        }

        activity.setDeleted(true);
        activity.setUpdatedBy(user.getEmail());
        activityRepository.save(activity);
    }

    @Override
    @Transactional(readOnly = true)
    public CarbonActivityResponse getActivityById(UUID id, String authenticatedEmail) {
        User user = findUserByEmail(authenticatedEmail);
        CarbonActivity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));

        if (!activity.getUser().getId().equals(user.getId()) || Boolean.TRUE.equals(activity.getDeleted())) {
            throw new ResourceNotFoundException("Activity not found");
        }

        return mapToResponse(activity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CarbonActivityResponse> getActivities(String categoryCode, int page, int size, String authenticatedEmail) {
        User user = findUserByEmail(authenticatedEmail);
        Pageable pageable = PageRequest.of(page, size);

        Page<CarbonActivity> activitiesPage;
        if (categoryCode != null && !categoryCode.trim().isEmpty() && !"ALL".equalsIgnoreCase(categoryCode)) {
            activitiesPage = activityRepository.findByUserIdAndCategoryCodeIgnoreCaseAndDeletedFalseOrderByActivityDateDesc(user.getId(), categoryCode, pageable);
        } else {
            activitiesPage = activityRepository.findByUserIdAndDeletedFalseOrderByActivityDateDesc(user.getId(), pageable);
        }

        return activitiesPage.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CarbonActivityResponse> getAllActivities(String authenticatedEmail) {
        User user = findUserByEmail(authenticatedEmail);
        return activityRepository.findByUserIdAndDeletedFalse(user.getId()).stream()
                .sorted(Comparator.comparing(CarbonActivity::getActivityDate).reversed())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CarbonSummaryResponse getSummary(String authenticatedEmail) {
        User user = findUserByEmail(authenticatedEmail);

        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        LocalDate startOfYear = today.withDayOfYear(1);

        BigDecimal todayEmission = activityRepository.sumEmissionsByDate(user.getId(), today);
        BigDecimal monthlyEmission = activityRepository.sumEmissionsBetweenDates(user.getId(), startOfMonth, today);
        BigDecimal yearlyEmission = activityRepository.sumEmissionsBetweenDates(user.getId(), startOfYear, today);
        BigDecimal totalOffsets = activityRepository.sumTotalOffsets(user.getId());

        // Calculate Sustainability Score (0 - 100)
        int baseScore = 85;
        if (monthlyEmission.compareTo(new BigDecimal("200")) > 0) {
            baseScore -= 15;
        } else if (monthlyEmission.compareTo(new BigDecimal("100")) < 0) {
            baseScore += 10;
        }
        if (totalOffsets.compareTo(BigDecimal.ZERO) > 0) {
            baseScore += 5;
        }
        int ecoScore = Math.min(100, Math.max(0, baseScore));

        // Category breakdown
        List<CarbonActivity> allUserActivities = activityRepository.findByUserIdAndDeletedFalse(user.getId());
        Map<String, BigDecimal> categoryBreakdown = new HashMap<>();
        for (CarbonActivity act : allUserActivities) {
            if (!Boolean.TRUE.equals(act.getIsOffset())) {
                BigDecimal current = categoryBreakdown.getOrDefault(act.getCategoryCode(), BigDecimal.ZERO);
                categoryBreakdown.put(act.getCategoryCode(), current.add(act.getCalculatedCo2()).setScale(2, RoundingMode.HALF_UP));
            }
        }

        return CarbonSummaryResponse.builder()
                .todayEmission(todayEmission.setScale(2, RoundingMode.HALF_UP))
                .monthlyEmission(monthlyEmission.setScale(2, RoundingMode.HALF_UP))
                .yearlyEmission(yearlyEmission.setScale(2, RoundingMode.HALF_UP))
                .totalOffsets(totalOffsets.setScale(2, RoundingMode.HALF_UP))
                .netCarbonScore(ecoScore)
                .categoryBreakdown(categoryBreakdown)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategories() {
        List<CarbonActivityCategory> categories = categoryRepository.findAll();
        List<CarbonEmissionFactor> activeFactors = factorRepository.findByIsActiveTrue();

        return categories.stream().map(cat -> {
            List<EmissionFactorDTO> factorDTOs = activeFactors.stream()
                    .filter(f -> f.getCategoryCode().equalsIgnoreCase(cat.getCode()))
                    .map(f -> EmissionFactorDTO.builder()
                            .id(f.getId())
                            .categoryCode(f.getCategoryCode())
                            .subCategory(f.getSubCategory())
                            .factorValue(f.getFactorValue())
                            .unit(f.getUnit())
                            .region(f.getRegion())
                            .build())
                    .collect(Collectors.toList());

            return CategoryDTO.builder()
                    .id(cat.getId())
                    .code(cat.getCode())
                    .name(cat.getName())
                    .description(cat.getDescription())
                    .icon(cat.getIcon())
                    .defaultUnit(cat.getDefaultUnit())
                    .isOffset(cat.getIsOffset())
                    .emissionFactors(factorDTOs)
                    .build();
        }).collect(Collectors.toList());
    }

    private User findUserByEmail(String email) {
        if (email == null || "anonymousUser".equals(email) || email.trim().isEmpty()) {
            email = "demo@ecotrack.com";
        }
        final String searchEmail = email;
        return userRepository.findByEmail(searchEmail)
                .orElseGet(() -> {
                    User demo = User.builder()
                            .email(searchEmail)
                            .fullName("Demo User")
                            .password("demo123")
                            .rewardPoints(100)
                            .badgeName("Green Explorer")
                            .build();
                    return userRepository.save(demo);
                });
    }

    private CarbonActivityResponse mapToResponse(CarbonActivity activity) {
        return CarbonActivityResponse.builder()
                .id(activity.getId())
                .userId(activity.getUser().getId())
                .categoryCode(activity.getCategoryCode())
                .subCategory(activity.getSubCategory())
                .activityDate(activity.getActivityDate())
                .activityName(activity.getActivityName())
                .quantity(activity.getQuantity())
                .unit(activity.getUnit())
                .detailJson(activity.getDetailJson())
                .calculatedCo2(activity.getCalculatedCo2())
                .emissionFactorUsed(activity.getEmissionFactorUsed())
                .notes(activity.getNotes())
                .isOffset(activity.getIsOffset())
                .createdAt(activity.getCreatedAt())
                .updatedAt(activity.getUpdatedAt())
                .build();
    }
}
