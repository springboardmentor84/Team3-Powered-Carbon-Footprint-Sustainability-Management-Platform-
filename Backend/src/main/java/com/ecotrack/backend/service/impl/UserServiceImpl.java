package com.ecotrack.backend.service.impl;

import com.ecotrack.backend.dto.GoogleLoginRequest;
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
import org.springframework.transaction.annotation.Transactional;

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
                user.getLifestyleConfig(),
                user.getProfileImage()
        );
    }

    @Override
    @Transactional
    public LoginResponse googleLogin(GoogleLoginRequest request) {
        String email = request.getEmail();
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Google account email is required.");
        }

        String fullName = request.getName();
        if (fullName == null || fullName.isBlank()) {
            fullName = email.split("@")[0];
        }

        final String finalFullName = fullName;
        final String profilePic = request.getPicture();

        // Check if user already exists
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            // Auto-provision user on first Google login
            User newUser = User.builder()
                    .email(email)
                    .fullName(finalFullName)
                    .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                    .role("ROLE_USER")
                    .rewardPoints(100)
                    .badgeName("Eco Pioneer")
                    .profileImage(profilePic != null ? profilePic : "")
                    .location("")
                    .environmentalInterests("Sustainability, Carbon Neutrality")
                    .lifestyleConfig("eco-conscious")
                    .build();
            return userRepository.save(newUser);
        });

        // Update profile picture if user doesn't have one
        if ((user.getProfileImage() == null || user.getProfileImage().isBlank()) && profilePic != null && !profilePic.isBlank()) {
            user.setProfileImage(profilePic);
            userRepository.save(user);
        }

        String token = jwtUtil.generateToken(user.getEmail());

        return new LoginResponse(
                token,
                "Google Login Successful",
                user.getEmail(),
                user.getId(),
                user.getFullName(),
                user.getRewardPoints(),
                user.getBadgeName(),
                user.getRole(),
                user.getLocation(),
                user.getEnvironmentalInterests(),
                user.getLifestyleConfig(),
                user.getProfileImage()
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

    @Override
    public User getUserProfile(String email) {
        String targetEmail = (email != null && !email.isBlank()) ? email : "demo@ecotrack.com";
        return userRepository.findByEmail(targetEmail)
                .or(() -> {
                    if ("demo@gmail.com".equalsIgnoreCase(targetEmail)) {
                        return userRepository.findByEmail("demo@ecotrack.com");
                    } else if ("demo@ecotrack.com".equalsIgnoreCase(targetEmail)) {
                        return userRepository.findByEmail("demo@gmail.com");
                    }
                    return java.util.Optional.empty();
                })
                .orElseGet(() -> userRepository.findAll().stream().findFirst().orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetEmail)));
    }

    @Override
    @Transactional
    public User updateUserProfile(String email, com.ecotrack.backend.dto.UserProfileUpdateRequest request) {
        User user = getUserProfile(email);

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }
        if (request.getLocation() != null) {
            user.setLocation(request.getLocation());
        }
        if (request.getEnvironmentalInterests() != null) {
            user.setEnvironmentalInterests(request.getEnvironmentalInterests());
        }
        if (request.getLifestyleConfig() != null) {
            user.setLifestyleConfig(request.getLifestyleConfig());
        }
        // Always update profileImage if explicitly provided (even empty string to clear it)
        if (request.getProfileImage() != null) {
            user.setProfileImage(request.getProfileImage().isEmpty() ? null : request.getProfileImage());
        }

        User savedUser = userRepository.save(user);
        userRepository.flush(); // Ensure immediate commit to database
        return savedUser;
    }
}