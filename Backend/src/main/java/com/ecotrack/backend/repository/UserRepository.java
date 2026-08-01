package com.ecotrack.backend.repository;

import com.ecotrack.backend.entity.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u ORDER BY COALESCE(u.rewardPoints, 0) DESC, u.id ASC")
    List<User> findLeaderboardUsers();

}