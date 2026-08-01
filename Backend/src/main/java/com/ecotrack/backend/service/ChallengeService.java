package com.ecotrack.backend.service;

import com.ecotrack.backend.dto.ChallengeCompletionRequest;
import com.ecotrack.backend.dto.ChallengeCompletionResponse;
import com.ecotrack.backend.dto.ChallengeResponse;
import com.ecotrack.backend.dto.LeaderboardResponse;

import java.util.List;

public interface ChallengeService {

    List<ChallengeResponse> getDailyChallenges(String authenticatedEmail);

    List<ChallengeResponse> getWeeklyChallenges(String authenticatedEmail);

    ChallengeCompletionResponse completeChallenge(ChallengeCompletionRequest request, String authenticatedEmail);

    List<LeaderboardResponse> getLeaderboard(String authenticatedEmail);
}
