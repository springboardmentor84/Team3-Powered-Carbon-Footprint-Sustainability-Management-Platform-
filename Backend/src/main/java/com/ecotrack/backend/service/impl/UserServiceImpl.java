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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

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
            if ("GOOGLE".equalsIgnoreCase(user.getAuthProvider())) {
                throw new RuntimeException("This account was registered using Google. Please click 'Sign in with Google' above, or click 'Forgot Password?' to set a password.");
            }
            throw new RuntimeException("Invalid password. Please check your password or reset it.");
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
                    .authProvider("GOOGLE")
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

        // Ensure authProvider is tagged
        if (user.getAuthProvider() == null || user.getAuthProvider().isBlank()) {
            user.setAuthProvider("GOOGLE");
            userRepository.save(user);
        }

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

    private static class ResetEntry {
        final String code;
        final long expiresAt;

        ResetEntry(String code, long expiresAt) {
            this.code = code;
            this.expiresAt = expiresAt;
        }
    }

    private final java.util.concurrent.ConcurrentHashMap<String, ResetEntry> resetCodeCache = new java.util.concurrent.ConcurrentHashMap<>();

    @Override
    public Map<String, Object> forgotPassword(String email) {
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email address is required.");
        }
        String targetEmail = email.trim();
        User user = userRepository.findByEmail(targetEmail)
                .or(() -> {
                    if ("demo@gmail.com".equalsIgnoreCase(targetEmail)) {
                        return userRepository.findByEmail("demo@ecotrack.com");
                    } else if ("demo@ecotrack.com".equalsIgnoreCase(targetEmail)) {
                        return userRepository.findByEmail("demo@gmail.com");
                    }
                    return java.util.Optional.empty();
                })
                .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + targetEmail));

        // Generate 6-digit numeric verification code
        String resetCode = String.format("%06d", new java.util.Random().nextInt(900000) + 100000);
        // Valid for 15 minutes
        resetCodeCache.put(user.getEmail().toLowerCase(), new ResetEntry(resetCode, System.currentTimeMillis() + 15 * 60 * 1000));

        boolean emailSent = false;

        if (mailSender != null && mailUsername != null && !mailUsername.isBlank()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(mailUsername);
                message.setTo(user.getEmail());
                message.setSubject("EcoTrack Password Reset Code: " + resetCode);
                message.setText("Hello " + user.getFullName() + ",\n\n"
                        + "A request was received to reset the password for your EcoTrack account.\n\n"
                        + "Your 6-digit verification code is:\n\n"
                        + "    " + resetCode + "\n\n"
                        + "This code will expire in 15 minutes.\n"
                        + "Please enter this verification code on the EcoTrack password reset screen to set your new password.\n\n"
                        + "If you did not request a password reset, please safely ignore this email.\n\n"
                        + "Best regards,\n"
                        + "The EcoTrack Sustainability Team");
                mailSender.send(message);
                emailSent = true;
                System.out.println("[Mail Service] Verification code emailed to: " + user.getEmail());
            } catch (Exception e) {
                System.err.println("[Mail Service] SMTP send failed: " + e.getMessage());
                emailSent = false;
            }
        } else {
            System.out.println("[LOCAL DEV MODE] Verification code for " + user.getEmail() + " is: " + resetCode);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("email", user.getEmail());
        response.put("emailSent", emailSent);
        response.put("authProvider", user.getAuthProvider());

        if (emailSent) {
            response.put("message", "A 6-digit verification code has been sent to " + user.getEmail() + ". Please check your inbox and spam folder.");
        } else {
            // Provide the code so the user is never blocked by a mail delivery timeout
            response.put("code", resetCode);
            response.put("message", "Verification code generated: " + resetCode + " (Please enter this code below to set your new password).");
        }
        return response;
    }

    @Override
    @Transactional
    public void resetPassword(String email, String code, String newPassword) {
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email address is required.");
        }
        if (code == null || code.trim().isBlank()) {
            throw new RuntimeException("Please enter the 6-digit verification code sent to your email.");
        }
        if (newPassword == null || newPassword.trim().length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters long.");
        }

        String targetEmail = email.trim();
        ResetEntry entry = resetCodeCache.get(targetEmail.toLowerCase());
        if (entry == null || System.currentTimeMillis() > entry.expiresAt) {
            throw new RuntimeException("Verification code has expired or was not requested. Please click 'Resend Code' to request a new one.");
        }

        if (!entry.code.trim().equalsIgnoreCase(code.trim())) {
            throw new RuntimeException("Invalid verification code. Please check the 6-digit code sent to your email and try again.");
        }

        User user = userRepository.findByEmail(targetEmail)
                .or(() -> {
                    if ("demo@gmail.com".equalsIgnoreCase(targetEmail)) {
                        return userRepository.findByEmail("demo@ecotrack.com");
                    } else if ("demo@ecotrack.com".equalsIgnoreCase(targetEmail)) {
                        return userRepository.findByEmail("demo@gmail.com");
                    }
                    return java.util.Optional.empty();
                })
                .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + targetEmail));

        // Invalidate the code once used
        resetCodeCache.remove(targetEmail.toLowerCase());

        user.setPassword(passwordEncoder.encode(newPassword.trim()));
        user.setAuthProvider("LOCAL"); // Allow local password login
        userRepository.save(user);
        userRepository.flush();
    }
}