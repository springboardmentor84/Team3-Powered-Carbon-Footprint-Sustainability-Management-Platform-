package com.ecotrack.backend.controller;

import com.ecotrack.backend.dto.ApiResponse;
import com.ecotrack.backend.entity.Goal;
import com.ecotrack.backend.service.GoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Goal>>> getGoals() {
        String email = getAuthenticatedEmail();
        List<Goal> goals = goalService.getGoals(email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Goals fetched successfully", goals));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Goal>> createGoal(@RequestBody Goal goal) {
        String email = getAuthenticatedEmail();
        Goal newGoal = goalService.createGoal(goal, email);
        return new ResponseEntity<>(new ApiResponse<>(true, "Goal created successfully", newGoal), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Goal>> updateGoal(@PathVariable Long id, @RequestBody Goal goal) {
        String email = getAuthenticatedEmail();
        Goal updatedGoal = goalService.updateGoal(id, goal, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Goal updated successfully", updatedGoal));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteGoal(@PathVariable Long id) {
        String email = getAuthenticatedEmail();
        goalService.deleteGoal(id, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Goal deleted successfully", null));
    }

    private String getAuthenticatedEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }
}
