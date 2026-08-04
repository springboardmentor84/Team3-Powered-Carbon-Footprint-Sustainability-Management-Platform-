package com.ecotrack.backend.service;

import com.ecotrack.backend.dto.DashboardResponse;

public interface DashboardService {
    DashboardResponse getDashboard(String authenticatedEmail);
}
