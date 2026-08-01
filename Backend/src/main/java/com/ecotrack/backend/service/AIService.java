package com.ecotrack.backend.service;

import com.ecotrack.backend.dto.RecommendationResponse;

public interface AIService {
    RecommendationResponse recommend(String authenticatedEmail);
}
