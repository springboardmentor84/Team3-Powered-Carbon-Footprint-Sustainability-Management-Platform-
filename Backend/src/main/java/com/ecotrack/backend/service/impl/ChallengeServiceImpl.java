package com.ecotrack.backend.service.impl;

import com.ecotrack.backend.dto.*;
import com.ecotrack.backend.entity.*;
import com.ecotrack.backend.exception.ResourceNotFoundException;
import com.ecotrack.backend.repository.ChallengeRepository;
import com.ecotrack.backend.repository.UserChallengeProgressRepository;
import com.ecotrack.backend.repository.UserRepository;
import com.ecotrack.backend.service.ChallengeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class ChallengeServiceImpl implements ChallengeService {

    private static final int BRONZE_THRESHOLD = 0;
    private static final int SILVER_THRESHOLD = 250;
    private static final int GOLD_THRESHOLD = 500;
    private static final int PLATINUM_THRESHOLD = 1000;

    private final ChallengeRepository challengeRepository;
    private final UserChallengeProgressRepository userChallengeProgressRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ChallengeResponse> getAllChallenges(String authenticatedEmail) {
        User user = findUserByEmailNullable(authenticatedEmail);
        return challengeRepository.findAll().stream()
                .filter(ch -> Boolean.TRUE.equals(ch.getActive()))
                .map(ch -> mapToResponse(ch, user))
                .toList();
    }

    @Override
    @Transactional
    public ChallengeResponse createChallenge(ChallengeRequest request, String authenticatedEmail) {
        User user = findUserByEmailNullable(authenticatedEmail);

        Challenge challenge = Challenge.builder()
                .title(request.getTitle())
                .category(request.getCategory() != null ? request.getCategory() : "PLASTIC_FREE_WEEK")
                .description(request.getDescription())
                .startDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now())
                .endDate(request.getEndDate() != null ? request.getEndDate() : LocalDate.now().plusDays(7))
                .targetValue(request.getTargetValue() != null ? request.getTargetValue() : 7)
                .unit(request.getUnit() != null ? request.getUnit() : "days")
                .rewardPoints(request.getRewardPoints() != null ? request.getRewardPoints() : 100)
                .rules(request.getRules() != null ? request.getRules() : "Follow sustainability guidelines.")
                .badgeName("Eco Warrior")
                .challengeType(ChallengeType.WEEKLY)
                .active(true)
                .createdBy(user)
                .creatorName(user != null ? user.getFullName() : "EcoTrack Community")
                .build();

        Challenge saved = challengeRepository.save(challenge);
        return mapToResponse(saved, user);
    }

    @Override
    @Transactional
    public ChallengeResponse updateChallenge(Long id, ChallengeRequest request, String authenticatedEmail) {
        Challenge challenge = challengeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Challenge not found with id: " + id));

        if (request.getTitle() != null) challenge.setTitle(request.getTitle());
        if (request.getCategory() != null) challenge.setCategory(request.getCategory());
        if (request.getDescription() != null) challenge.setDescription(request.getDescription());
        if (request.getStartDate() != null) challenge.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) challenge.setEndDate(request.getEndDate());
        if (request.getTargetValue() != null) challenge.setTargetValue(request.getTargetValue());
        if (request.getUnit() != null) challenge.setUnit(request.getUnit());
        if (request.getRewardPoints() != null) challenge.setRewardPoints(request.getRewardPoints());
        if (request.getRules() != null) challenge.setRules(request.getRules());

        Challenge updated = challengeRepository.save(challenge);
        User user = findUserByEmailNullable(authenticatedEmail);
        return mapToResponse(updated, user);
    }

    @Override
    @Transactional
    public void deleteChallenge(Long id, String authenticatedEmail) {
        Challenge challenge = challengeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Challenge not found with id: " + id));
        challenge.setActive(false);
        challengeRepository.save(challenge);
    }

    @Override
    @Transactional
    public ChallengeResponse joinChallenge(Long id, String authenticatedEmail) {
        User user = findUserByEmail(authenticatedEmail);
        Challenge challenge = challengeRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Challenge not found with id: " + id));

        if (userChallengeProgressRepository.existsByUserIdAndChallengeId(user.getId(), challenge.getId())) {
            // Return existing state without creating duplicate
            return mapToResponse(challenge, user);
        }

        UserChallengeProgress progress = UserChallengeProgress.builder()
                .user(user)
                .challenge(challenge)
                .currentProgress(0)
                .status("In Progress")
                .joinedAt(LocalDateTime.now())
                .build();

        userChallengeProgressRepository.save(progress);
        return mapToResponse(challenge, user);
    }

    @Override
    @Transactional
    public ChallengeResponse updateProgress(Long id, ChallengeProgressRequest request, String authenticatedEmail) {
        User user = findUserByEmail(authenticatedEmail);
        Challenge challenge = challengeRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Challenge not found with id: " + id));

        UserChallengeProgress progress = userChallengeProgressRepository.findByUserIdAndChallengeId(user.getId(), challenge.getId())
                .orElseGet(() -> UserChallengeProgress.builder()
                        .user(user)
                        .challenge(challenge)
                        .currentProgress(0)
                        .status("In Progress")
                        .joinedAt(LocalDateTime.now())
                        .build());

        int newProgress = request.getCurrentProgress() != null ? request.getCurrentProgress() : 0;
        progress.setCurrentProgress(newProgress);

        int target = challenge.getTargetValue() != null ? challenge.getTargetValue() : 7;
        if (newProgress >= target && !"Completed".equals(progress.getStatus())) {
            progress.setStatus("Completed");
            progress.setCompletedAt(LocalDateTime.now());
            
            int reward = challenge.getRewardPoints() != null ? challenge.getRewardPoints() : 100;
            progress.setRewardPointsEarned(reward);

            int currentPoints = safePoints(user.getRewardPoints());
            int newTotalPoints = currentPoints + reward;
            String badgeName = determineBadge(newTotalPoints);

            user.setRewardPoints(newTotalPoints);
            user.setBadgeName(badgeName);
            userRepository.save(user);
        } else if (newProgress < target && !"Completed".equals(progress.getStatus())) {
            progress.setStatus(newProgress > 0 ? "In Progress" : "Joined");
        }

        userChallengeProgressRepository.save(progress);
        return mapToResponse(challenge, user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChallengeResponse> getDailyChallenges(String authenticatedEmail) {
        User user = findUserByEmailNullable(authenticatedEmail);
        return challengeRepository.findByChallengeTypeAndActiveTrue(ChallengeType.DAILY).stream()
                .map(ch -> mapToResponse(ch, user))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChallengeResponse> getWeeklyChallenges(String authenticatedEmail) {
        User user = findUserByEmailNullable(authenticatedEmail);
        return challengeRepository.findByChallengeTypeAndActiveTrue(ChallengeType.WEEKLY).stream()
                .map(ch -> mapToResponse(ch, user))
                .toList();
    }

    @Override
    @Transactional
    public ChallengeCompletionResponse completeChallenge(ChallengeCompletionRequest request, String authenticatedEmail) {
        User user = findUserByEmail(authenticatedEmail);
        Challenge challenge = challengeRepository.findByIdAndActiveTrue(request.getChallengeId())
                .orElseThrow(() -> new ResourceNotFoundException("Challenge not found"));

        UserChallengeProgress progress = userChallengeProgressRepository.findByUserIdAndChallengeId(user.getId(), challenge.getId())
                .orElse(null);

        if (progress != null && "Completed".equals(progress.getStatus())) {
            throw new IllegalStateException("Challenge already completed");
        }

        int currentPoints = safePoints(user.getRewardPoints());
        int reward = challenge.getRewardPoints() != null ? challenge.getRewardPoints() : 100;
        int newTotalPoints = currentPoints + reward;
        String badgeName = determineBadge(newTotalPoints);

        user.setRewardPoints(newTotalPoints);
        user.setBadgeName(badgeName);
        userRepository.save(user);

        if (progress == null) {
            progress = UserChallengeProgress.builder()
                    .user(user)
                    .challenge(challenge)
                    .currentProgress(challenge.getTargetValue() != null ? challenge.getTargetValue() : 7)
                    .status("Completed")
                    .completedAt(LocalDateTime.now())
                    .rewardPointsEarned(reward)
                    .badgeEarned(badgeName)
                    .joinedAt(LocalDateTime.now())
                    .build();
        } else {
            progress.setStatus("Completed");
            progress.setCurrentProgress(challenge.getTargetValue() != null ? challenge.getTargetValue() : progress.getCurrentProgress());
            progress.setCompletedAt(LocalDateTime.now());
            progress.setRewardPointsEarned(reward);
            progress.setBadgeEarned(badgeName);
        }

        userChallengeProgressRepository.save(progress);

        return ChallengeCompletionResponse.builder()
                .challengeId(challenge.getId())
                .challengeTitle(challenge.getTitle())
                .rewardPointsEarned(reward)
                .totalRewardPoints(newTotalPoints)
                .badgeEarned(badgeName)
                .message("Challenge completed successfully")
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeaderboardResponse> getLeaderboard(String authenticatedEmail) {
        User currentUser = findUserByEmailNullable(authenticatedEmail);
        AtomicInteger rank = new AtomicInteger(1);
        
        return userRepository.findLeaderboardUsers().stream()
                .limit(10)
                .map(user -> {
                    long completedCount = userChallengeProgressRepository.countByUserIdAndStatus(user.getId(), "Completed");
                    boolean isSelf = currentUser != null && currentUser.getId().equals(user.getId());

                    return LeaderboardResponse.builder()
                            .rank(rank.getAndIncrement())
                            .userId(user.getId())
                            .fullName(user.getFullName())
                            .rewardPoints(safePoints(user.getRewardPoints()))
                            .badgeName(determineBadge(safePoints(user.getRewardPoints())))
                            .challengesCompleted((int) completedCount)
                            .isCurrentUser(isSelf)
                            .profileImage(user.getProfileImage())
                            .build();
                })
                .toList();
    }

    private User findUserByEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ResourceNotFoundException("User not authenticated");
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private User findUserByEmailNullable(String email) {
        if (email == null || email.isBlank()) return null;
        return userRepository.findByEmail(email).orElse(null);
    }

    private ChallengeResponse mapToResponse(Challenge challenge, User user) {
        boolean joined = false;
        int currentProgress = 0;
        String status = "Not Started";

        if (user != null) {
            Optional<UserChallengeProgress> progOpt = userChallengeProgressRepository.findByUserIdAndChallengeId(user.getId(), challenge.getId());
            if (progOpt.isPresent()) {
                UserChallengeProgress ucp = progOpt.get();
                joined = true;
                currentProgress = ucp.getCurrentProgress() != null ? ucp.getCurrentProgress() : 0;
                status = ucp.getStatus() != null ? ucp.getStatus() : "In Progress";
            }
        }

        // Check expiration
        if (challenge.getEndDate() != null && LocalDate.now().isAfter(challenge.getEndDate()) && !"Completed".equals(status)) {
            status = "Expired";
        }

        long participantCount = userChallengeProgressRepository.countByChallengeId(challenge.getId());

        Long createdByUserId = challenge.getCreatedBy() != null ? challenge.getCreatedBy().getId() : null;
        String creator = challenge.getCreatorName() != null ? challenge.getCreatorName()
                : (challenge.getCreatedBy() != null ? challenge.getCreatedBy().getFullName() : "EcoTrack Community");
        boolean isCreatedByCurrentUser = user != null && createdByUserId != null && user.getId().equals(createdByUserId);

        return ChallengeResponse.builder()
                .id(challenge.getId())
                .title(challenge.getTitle())
                .description(challenge.getDescription())
                .category(challenge.getCategory() != null ? challenge.getCategory() : "PLASTIC_FREE_WEEK")
                .challengeType(challenge.getChallengeType() != null ? challenge.getChallengeType() : ChallengeType.WEEKLY)
                .rewardPoints(challenge.getRewardPoints() != null ? challenge.getRewardPoints() : 100)
                .badgeName(challenge.getBadgeName() != null ? challenge.getBadgeName() : "Eco Warrior")
                .targetValue(challenge.getTargetValue() != null ? challenge.getTargetValue() : 7)
                .unit(challenge.getUnit() != null ? challenge.getUnit() : "days")
                .rules(challenge.getRules() != null ? challenge.getRules() : "Follow sustainability rules.")
                .startDate(challenge.getStartDate() != null ? challenge.getStartDate() : LocalDate.now())
                .endDate(challenge.getEndDate() != null ? challenge.getEndDate() : LocalDate.now().plusDays(7))
                .active(challenge.getActive())
                .createdAt(challenge.getCreatedAt())
                .joined(joined)
                .currentProgress(currentProgress)
                .status(status)
                .participantCount(participantCount)
                .createdByUserId(createdByUserId)
                .creatorName(creator)
                .isCreatedByCurrentUser(isCreatedByCurrentUser)
                .build();
    }

    private int safePoints(Integer rewardPoints) {
        return rewardPoints == null ? 0 : rewardPoints;
    }

    private String determineBadge(int totalPoints) {
        if (totalPoints >= PLATINUM_THRESHOLD) return "Platinum";
        if (totalPoints >= GOLD_THRESHOLD) return "Gold";
        if (totalPoints >= SILVER_THRESHOLD) return "Silver";
        return "Bronze";
    }
}
