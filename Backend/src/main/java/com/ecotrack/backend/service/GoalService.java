package com.ecotrack.backend.service;

import com.ecotrack.backend.entity.Goal;
import java.util.List;

public interface GoalService {
    List<Goal> getGoals(String email);
    Goal createGoal(Goal goal, String email);
    Goal updateGoal(Long id, Goal goal, String email);
    void deleteGoal(Long id, String email);
}
