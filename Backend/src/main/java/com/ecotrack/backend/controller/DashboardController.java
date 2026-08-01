package com.ecotrack.backend.controller;

import com.ecotrack.backend.dto.ApiResponse;
import com.ecotrack.backend.dto.DashboardResponse;
import com.ecotrack.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard() {
        String authenticatedEmail = getAuthenticatedEmail();
        DashboardResponse dashboardResponse = dashboardService.getDashboard(authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Dashboard data fetched successfully", dashboardResponse));
    }

    private String getAuthenticatedEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }
}
