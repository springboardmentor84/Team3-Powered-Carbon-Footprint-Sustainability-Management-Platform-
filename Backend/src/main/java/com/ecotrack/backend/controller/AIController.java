package com.ecotrack.backend.controller;

import com.ecotrack.backend.dto.ApiResponse;
import com.ecotrack.backend.dto.RecommendationResponse;
import com.ecotrack.backend.service.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    @PostMapping("/recommend")
    public ResponseEntity<ApiResponse<RecommendationResponse>> recommend() {
        String authenticatedEmail = getAuthenticatedEmail();
        RecommendationResponse response = aiService.recommend(authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Recommendations generated successfully", response));
    }

    @PostMapping("/analyze")
    public ResponseEntity<ApiResponse<String>> analyze(@org.springframework.web.bind.annotation.RequestBody(required = false) java.util.Map<String, String> payload) {
        String prompt = payload != null ? payload.getOrDefault("prompt", "") : "";
        String authenticatedEmail = getAuthenticatedEmail();
        String result = aiService.analyzePrompt(prompt, authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Analysis complete", result));
    }

    private String getAuthenticatedEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }
}
