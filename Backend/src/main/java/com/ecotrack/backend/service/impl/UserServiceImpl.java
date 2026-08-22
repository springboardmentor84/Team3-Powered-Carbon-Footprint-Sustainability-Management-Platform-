package com.ecotrack.backend.service.impl;

import com.ecotrack.backend.dto.LoginRequest;
import com.ecotrack.backend.dto.LoginResponse;
import com.ecotrack.backend.dto.UserRegistrationRequest;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.exception.EmailAlreadyExistsException;
import com.ecotrack.backend.exception.ResourceNotFoundException;
import com.ecotrack.backend.repository.UserRepository;
import com.ecotrack.backend.service.UserService;
import com.ecotrack.backend.utils.JwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public UserServiceImpl(UserRepository userRepository,
                           BCryptPasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public User registerUser(UserRegistrationRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email already exists");
        }

        // Ensure public registration only creates ROLE_USER or ROLE_ORGANIZATION.
        // ROLE_ADMIN can only be granted by an existing administrator via the Admin Governance Panel.
        String assignedRole = "ROLE_USER";
        if ("ROLE_ORGANIZATION".equalsIgnoreCase(request.getRole())) {
            assignedRole = "ROLE_ORGANIZATION";
        } else {
            assignedRole = "ROLE_USER";
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(assignedRole)
                .location(request.getLocation())
                .environmentalInterests(request.getEnvironmentalInterests())
                .lifestyleConfig(request.getLifestyleConfig())
                .build();

        return userRepository.save(user);
    }

    @Override
    public LoginResponse loginUser(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .or(() -> {
                    if ("demo@gmail.com".equalsIgnoreCase(request.getEmail())) {
                        return userRepository.findByEmail("demo@ecotrack.com");
                    } else if ("demo@ecotrack.com".equalsIgnoreCase(request.getEmail())) {
                        return userRepository.findByEmail("demo@gmail.com");
                    }
                    return java.util.Optional.empty();
                })
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getEmail()));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        String token = jwtUtil.generateToken(user.getEmail());

        return new LoginResponse(
                token,
                "Login Successful",
                user.getEmail(),
                user.getId(),
                user.getFullName(),
                user.getRewardPoints(),
                user.getBadgeName(),
                user.getRole(),
                user.getLocation(),
                user.getEnvironmentalInterests(),
                user.getLifestyleConfig()
        );
    }

    @Override
    public java.util.List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public User updateUserRole(Long id, String role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setRole(role != null ? role : "ROLE_USER");
        return userRepository.save(user);
    }

    @Override
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        userRepository.delete(user);
    }
}