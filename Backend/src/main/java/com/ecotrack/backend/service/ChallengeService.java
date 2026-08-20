package com.ecotrack.backend.service;

import com.ecotrack.backend.dto.*;

import java.util.List;

public interface ChallengeService {

    List<ChallengeResponse> getAllChallenges(String authenticatedEmail);

    ChallengeResponse createChallenge(ChallengeRequest request, String authenticatedEmail);

    ChallengeResponse updateChallenge(Long id, ChallengeRequest request, String authenticatedEmail);

    void deleteChallenge(Long id, String authenticatedEmail);

    ChallengeResponse joinChallenge(Long id, String authenticatedEmail);

    ChallengeResponse updateProgress(Long id, ChallengeProgressRequest request, String authenticatedEmail);

    List<ChallengeResponse> getDailyChallenges(String authenticatedEmail);

    List<ChallengeResponse> getWeeklyChallenges(String authenticatedEmail);

    ChallengeCompletionResponse completeChallenge(ChallengeCompletionRequest request, String authenticatedEmail);

    List<LeaderboardResponse> getLeaderboard(String authenticatedEmail);
}
