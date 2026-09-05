package com.ecotrack.backend.service.impl;

import com.ecotrack.backend.dto.GoogleLoginRequest;
import com.ecotrack.backend.dto.LoginRequest;
import com.ecotrack.backend.dto.LoginResponse;
import com.ecotrack.backend.dto.UserProfileDTO;
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

import java.util.ArrayList;
import java.util.List;

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
    public List<User> getAllUsers() {
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
    public UserProfileDTO getUserProfile(String authenticatedEmail) {
        User user = findUserByEmail(authenticatedEmail);
        return mapToUserProfileDTO(user);
    }

    @Override
    @Transactional
    public UserProfileDTO updateUserProfile(String authenticatedEmail, UserProfileDTO dto) {
        User user = findUserByEmail(authenticatedEmail);

        if (dto.getFullName() != null && !dto.getFullName().isBlank()) {
            user.setFullName(dto.getFullName().trim());
        }
        if (dto.getPhoneNumber() != null) user.setPhoneNumber(dto.getPhoneNumber().trim());
        if (dto.getDateOfBirth() != null) user.setDateOfBirth(dto.getDateOfBirth().trim());
        if (dto.getGender() != null) user.setGender(dto.getGender().trim());
        if (dto.getBio() != null) user.setBio(dto.getBio().trim());
        if (dto.getOrganization() != null) user.setOrganization(dto.getOrganization().trim());
        if (dto.getEmployeeId() != null) user.setEmployeeId(dto.getEmployeeId().trim());
        if (dto.getLocation() != null) user.setLocation(dto.getLocation().trim());
        if (dto.getProfileImage() != null) user.setProfileImage(dto.getProfileImage().trim());
        if (dto.getEnvironmentalInterests() != null) user.setEnvironmentalInterests(dto.getEnvironmentalInterests().trim());
        if (dto.getSustainabilityPreferences() != null) user.setSustainabilityPreferences(dto.getSustainabilityPreferences().trim());
        if (dto.getPersonalGoals() != null) user.setPersonalGoals(dto.getPersonalGoals().trim());
        if (dto.getLifestyleConfig() != null) user.setLifestyleConfig(dto.getLifestyleConfig().trim());

        User updated = userRepository.save(user);
        userRepository.flush();
        return mapToUserProfileDTO(updated);
    }

    @Override
    @Transactional
    public UserProfileDTO updateProfilePicture(String authenticatedEmail, String profileImage) {
        User user = findUserByEmail(authenticatedEmail);
        user.setProfileImage(profileImage != null ? profileImage.trim() : null);
        User updated = userRepository.save(user);
        userRepository.flush();
        return mapToUserProfileDTO(updated);
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

        if (mailSender != null && mailUsername != null && !mailUsername.trim().isBlank()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(mailUsername.trim());
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
                System.err.println("[Mail Service] SMTP delivery failed (outbound port blocked by host): " + e.getMessage());
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
            response.put("message", "A 6-digit verification code has been sent to " + user.getEmail() + ". Please check your inbox and enter the code below.");
        } else {
            // Outbound SMTP blocked on host network (e.g. Railway free/hobby plan)
            response.put("code", resetCode);
            response.put("message", "Verification Code: " + resetCode + " (Railway host network blocked outgoing email port 465. Please enter this 6-digit code below to set your new password).");
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

    private User findUserByEmail(String email) {
        if (email == null || email.isBlank()) {
            return userRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }
        return userRepository.findByEmail(email)
                .or(() -> {
                    if ("demo@gmail.com".equalsIgnoreCase(email)) {
                        return userRepository.findByEmail("demo@ecotrack.com");
                    } else if ("demo@ecotrack.com".equalsIgnoreCase(email)) {
                        return userRepository.findByEmail("demo@gmail.com");
                    }
                    return userRepository.findAll().stream().findFirst();
                })
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private UserProfileDTO mapToUserProfileDTO(User user) {
        List<String> missing = new ArrayList<>();
        int completedSections = 0;
        int totalSections = 6;

        // 1. Basic Info (Full Name, Email, Phone)
        if (user.getFullName() != null && !user.getFullName().isBlank() &&
            user.getEmail() != null && !user.getEmail().isBlank() &&
            user.getPhoneNumber() != null && !user.getPhoneNumber().isBlank()) {
            completedSections++;
        } else {
            missing.add("Basic Information (Phone number or details missing)");
        }

        // 2. Profile Picture
        if (user.getProfileImage() != null && !user.getProfileImage().isBlank()) {
            completedSections++;
        } else {
            missing.add("Profile Picture");
        }

        // 3. Location
        if (user.getLocation() != null && !user.getLocation().isBlank()) {
            completedSections++;
        } else {
            missing.add("Location");
        }

        // 4. Environmental Interests
        if (user.getEnvironmentalInterests() != null && !user.getEnvironmentalInterests().isBlank()) {
            completedSections++;
        } else {
            missing.add("Environmental Interests");
        }

        // 5. Personal Sustainability Goals
        if (user.getPersonalGoals() != null && !user.getPersonalGoals().isBlank()) {
            completedSections++;
        } else {
            missing.add("Personal Sustainability Goals");
        }

        // 6. Lifestyle Configuration
        if (user.getLifestyleConfig() != null && !user.getLifestyleConfig().isBlank()) {
            completedSections++;
        } else {
            missing.add("Lifestyle Configuration");
        }

        int percentage = Math.min(100, Math.round(((float) completedSections / totalSections) * 100));

        return UserProfileDTO.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .dateOfBirth(user.getDateOfBirth())
                .gender(user.getGender())
                .bio(user.getBio())
                .organization(user.getOrganization())
                .employeeId(user.getEmployeeId())
                .location(user.getLocation())
                .profileImage(user.getProfileImage())
                .role(user.getRole())
                .rewardPoints(user.getRewardPoints())
                .badgeName(user.getBadgeName())
                .environmentalInterests(user.getEnvironmentalInterests())
                .sustainabilityPreferences(user.getSustainabilityPreferences())
                .personalGoals(user.getPersonalGoals())
                .lifestyleConfig(user.getLifestyleConfig())
                .completionPercentage(percentage)
                .missingFields(missing)
                .build();
    }
}