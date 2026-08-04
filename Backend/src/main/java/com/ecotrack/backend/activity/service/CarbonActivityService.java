package com.ecotrack.backend.activity.service;

import com.ecotrack.backend.activity.dto.*;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.UUID;

public interface CarbonActivityService {
    CarbonActivityResponse createActivity(CarbonActivityCreateRequest request, String authenticatedEmail);
    CarbonActivityResponse updateActivity(UUID id, CarbonActivityCreateRequest request, String authenticatedEmail);
    void deleteActivity(UUID id, String authenticatedEmail);
    CarbonActivityResponse getActivityById(UUID id, String authenticatedEmail);
    Page<CarbonActivityResponse> getActivities(String categoryCode, int page, int size, String authenticatedEmail);
    List<CarbonActivityResponse> getAllActivities(String authenticatedEmail);
    CarbonSummaryResponse getSummary(String authenticatedEmail);
    List<CategoryDTO> getAllCategories();
}
