package com.ecotrack.backend.service;

import com.ecotrack.backend.dto.RecommendationResponse;

public interface AIService {
    RecommendationResponse recommend(String authenticatedEmail);
    String analyzePrompt(String prompt, String context, String authenticatedEmail);
}
