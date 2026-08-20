package com.ecotrack.backend.controller;

import com.ecotrack.backend.dto.*;
import com.ecotrack.backend.service.ChallengeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/challenges")
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeService challengeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ChallengeResponse>>> getAllChallenges() {
        String authenticatedEmail = getAuthenticatedEmail();
        List<ChallengeResponse> challenges = challengeService.getAllChallenges(authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Challenges fetched successfully", challenges));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ChallengeResponse>> createChallenge(@Valid @RequestBody ChallengeRequest request) {
        String authenticatedEmail = getAuthenticatedEmail();
        ChallengeResponse challenge = challengeService.createChallenge(request, authenticatedEmail);
        return new ResponseEntity<>(new ApiResponse<>(true, "Challenge created successfully", challenge), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ChallengeResponse>> updateChallenge(
            @PathVariable Long id,
            @Valid @RequestBody ChallengeRequest request) {
        String authenticatedEmail = getAuthenticatedEmail();
        ChallengeResponse challenge = challengeService.updateChallenge(id, request, authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Challenge updated successfully", challenge));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteChallenge(@PathVariable Long id) {
        String authenticatedEmail = getAuthenticatedEmail();
        challengeService.deleteChallenge(id, authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Challenge deleted successfully", null));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<ApiResponse<ChallengeResponse>> joinChallenge(@PathVariable Long id) {
        String authenticatedEmail = getAuthenticatedEmail();
        ChallengeResponse challenge = challengeService.joinChallenge(id, authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Successfully joined the challenge", challenge));
    }

    @PutMapping("/{id}/progress")
    public ResponseEntity<ApiResponse<ChallengeResponse>> updateProgress(
            @PathVariable Long id,
            @Valid @RequestBody ChallengeProgressRequest request) {
        String authenticatedEmail = getAuthenticatedEmail();
        ChallengeResponse challenge = challengeService.updateProgress(id, request, authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Challenge progress updated successfully", challenge));
    }

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<List<ChallengeResponse>>> getDailyChallenges() {
        String authenticatedEmail = getAuthenticatedEmail();
        List<ChallengeResponse> challenges = challengeService.getDailyChallenges(authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Daily challenges fetched successfully", challenges));
    }

    @GetMapping("/weekly")
    public ResponseEntity<ApiResponse<List<ChallengeResponse>>> getWeeklyChallenges() {
        String authenticatedEmail = getAuthenticatedEmail();
        List<ChallengeResponse> challenges = challengeService.getWeeklyChallenges(authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Weekly challenges fetched successfully", challenges));
    }

    @PostMapping("/complete")
    public ResponseEntity<ApiResponse<ChallengeCompletionResponse>> completeChallenge(@Valid @RequestBody ChallengeCompletionRequest request) {
        String authenticatedEmail = getAuthenticatedEmail();
        ChallengeCompletionResponse response = challengeService.completeChallenge(request, authenticatedEmail);
        return new ResponseEntity<>(new ApiResponse<>(true, "Challenge completed successfully", response), HttpStatus.CREATED);
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<ApiResponse<List<LeaderboardResponse>>> getLeaderboard() {
        String authenticatedEmail = getAuthenticatedEmail();
        List<LeaderboardResponse> leaderboard = challengeService.getLeaderboard(authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Leaderboard fetched successfully", leaderboard));
    }

    private String getAuthenticatedEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }
}
