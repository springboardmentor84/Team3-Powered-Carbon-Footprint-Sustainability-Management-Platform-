package com.ecotrack.backend.activity.controller;

import com.ecotrack.backend.activity.dto.*;
import com.ecotrack.backend.activity.service.CarbonActivityService;
import com.ecotrack.backend.activity.service.CarbonCalculationService;
import com.ecotrack.backend.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
@Tag(name = "Carbon Activity Management", description = "REST APIs for 11-category Carbon Activity Tracking, Calculation Engine, and Analytics")
public class CarbonActivityController {

    private final CarbonActivityService activityService;
    private final CarbonCalculationService calculationService;

    @PostMapping
    @Operation(summary = "Create a new carbon activity (auto-calculates CO2e)")
    public ResponseEntity<ApiResponse<CarbonActivityResponse>> createActivity(@Valid @RequestBody CarbonActivityCreateRequest request) {
        String authenticatedEmail = getAuthenticatedEmail();
        CarbonActivityResponse response = activityService.createActivity(request, authenticatedEmail);
        return new ResponseEntity<>(new ApiResponse<>(true, "Activity logged successfully", response), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing carbon activity by UUID")
    public ResponseEntity<ApiResponse<CarbonActivityResponse>> updateActivity(@PathVariable UUID id, @Valid @RequestBody CarbonActivityCreateRequest request) {
        String authenticatedEmail = getAuthenticatedEmail();
        CarbonActivityResponse response = activityService.updateActivity(id, request, authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Activity updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete a carbon activity by UUID")
    public ResponseEntity<ApiResponse<Void>> deleteActivity(@PathVariable UUID id) {
        String authenticatedEmail = getAuthenticatedEmail();
        activityService.deleteActivity(id, authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Activity deleted successfully", null));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get detailed activity record by UUID")
    public ResponseEntity<ApiResponse<CarbonActivityResponse>> getActivityById(@PathVariable UUID id) {
        String authenticatedEmail = getAuthenticatedEmail();
        CarbonActivityResponse response = activityService.getActivityById(id, authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Activity retrieved successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get paginated activities for user, optionally filtered by categoryCode")
    public ResponseEntity<ApiResponse<Page<CarbonActivityResponse>>> getActivities(
            @RequestParam(required = false) String categoryCode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String authenticatedEmail = getAuthenticatedEmail();
        Page<CarbonActivityResponse> responsePage = activityService.getActivities(categoryCode, page, size, authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Activities retrieved successfully", responsePage));
    }

    @GetMapping("/all")
    @Operation(summary = "Get all activities for user (unpaginated list)")
    public ResponseEntity<ApiResponse<List<CarbonActivityResponse>>> getAllActivities() {
        String authenticatedEmail = getAuthenticatedEmail();
        List<CarbonActivityResponse> list = activityService.getAllActivities(authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "All activities retrieved successfully", list));
    }

    @GetMapping("/summary/carbon")
    @Operation(summary = "Get dashboard summary stats: Today, Monthly, Yearly, Net Score, Offsets, Category breakdown")
    public ResponseEntity<ApiResponse<CarbonSummaryResponse>> getSummary() {
        String authenticatedEmail = getAuthenticatedEmail();
        CarbonSummaryResponse summary = activityService.getSummary(authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Carbon summary retrieved successfully", summary));
    }

    @GetMapping("/categories")
    @Operation(summary = "Get all 11 supported Carbon Activity Categories and their active Emission Factors")
    public ResponseEntity<ApiResponse<List<CategoryDTO>>> getCategories() {
        List<CategoryDTO> categories = activityService.getAllCategories();
        return ResponseEntity.ok(new ApiResponse<>(true, "Categories retrieved successfully", categories));
    }

    @PostMapping("/calculate")
    @Operation(summary = "Preview calculation without saving (Carbon = Quantity x Emission Factor)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> previewCalculation(@RequestBody Map<String, Object> payload) {
        String categoryCode = (String) payload.get("categoryCode");
        String subCategory = (String) payload.get("subCategory");
        BigDecimal quantity = new BigDecimal(payload.get("quantity").toString());

        BigDecimal factor = calculationService.getEmissionFactor(categoryCode, subCategory);
        BigDecimal calculatedCo2 = quantity.multiply(factor);

        Map<String, Object> result = Map.of(
                "calculatedCo2", calculatedCo2,
                "emissionFactorUsed", factor
        );
        return ResponseEntity.ok(new ApiResponse<>(true, "Calculation preview complete", result));
    }

    private String getAuthenticatedEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }
}
