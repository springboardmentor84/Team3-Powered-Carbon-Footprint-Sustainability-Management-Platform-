package com.ecotrack.backend.service.impl;

import com.ecotrack.backend.entity.Goal;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.exception.ResourceNotFoundException;
import com.ecotrack.backend.repository.GoalRepository;
import com.ecotrack.backend.repository.UserRepository;
import com.ecotrack.backend.service.GoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GoalServiceImpl implements GoalService {

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Goal> getGoals(String email) {
        return goalRepository.findByUserEmail(email);
    }

    @Override
    @Transactional
    public Goal createGoal(Goal goal, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        goal.setUser(user);
        if (goal.getCurrent() == null) {
            goal.setCurrent(BigDecimal.ZERO);
        }
        
        if (goal.getTarget() != null && goal.getCurrent().compareTo(goal.getTarget()) >= 0) {
            goal.setStatus("Completed");
        } else {
            goal.setStatus("In Progress");
        }
        
        return goalRepository.save(goal);
    }

    @Override
    @Transactional
    public Goal updateGoal(Long id, Goal goalDetails, String email) {
        Goal existingGoal = goalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found with id: " + id));

        if (existingGoal.getUser() != null && !existingGoal.getUser().getEmail().equalsIgnoreCase(email)) {
            throw new ResourceNotFoundException("Goal not found for this user");
        }

        if (goalDetails.getType() != null) existingGoal.setType(goalDetails.getType());
        if (goalDetails.getTitle() != null) existingGoal.setTitle(goalDetails.getTitle());
        if (goalDetails.getTarget() != null) existingGoal.setTarget(goalDetails.getTarget());
        if (goalDetails.getCurrent() != null) existingGoal.setCurrent(goalDetails.getCurrent());
        if (goalDetails.getUnit() != null) existingGoal.setUnit(goalDetails.getUnit());
        if (goalDetails.getTimeframe() != null) existingGoal.setTimeframe(goalDetails.getTimeframe());
        if (goalDetails.getStartDate() != null) existingGoal.setStartDate(goalDetails.getStartDate());
        if (goalDetails.getEndDate() != null) existingGoal.setEndDate(goalDetails.getEndDate());

        if (existingGoal.getTarget() != null && existingGoal.getCurrent() != null &&
            existingGoal.getCurrent().compareTo(existingGoal.getTarget()) >= 0) {
            existingGoal.setStatus("Completed");
        } else {
            existingGoal.setStatus("In Progress");
        }

        return goalRepository.save(existingGoal);
    }

    @Override
    @Transactional
    public void deleteGoal(Long id, String email) {
        Goal existingGoal = goalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found with id: " + id));

        if (existingGoal.getUser() != null && !existingGoal.getUser().getEmail().equalsIgnoreCase(email)) {
            throw new ResourceNotFoundException("Goal not found for this user");
        }

        goalRepository.delete(existingGoal);
    }
}
