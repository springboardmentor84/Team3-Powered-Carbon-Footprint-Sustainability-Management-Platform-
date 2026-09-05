package com.ecotrack.backend.controller;

import com.ecotrack.backend.dto.ApiResponse;
import com.ecotrack.backend.dto.GoogleLoginRequest;
import com.ecotrack.backend.dto.LoginRequest;
import com.ecotrack.backend.dto.LoginResponse;
import com.ecotrack.backend.dto.UserProfileDTO;
import com.ecotrack.backend.dto.UserRegistrationRequest;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.service.UserService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @org.springframework.beans.factory.annotation.Value("${google.client.id:}")
    private String googleClientId;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<User>> registerUser(@RequestBody UserRegistrationRequest request) {
        User savedUser = userService.registerUser(request);
        ApiResponse<User> response = new ApiResponse<>(true, "User registered successfully", savedUser);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse loginData = userService.loginUser(request);
        ApiResponse<LoginResponse> response = new ApiResponse<>(true, "Login successful", loginData);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google-login")
    public ResponseEntity<ApiResponse<LoginResponse>> googleLogin(@RequestBody GoogleLoginRequest request) {
        LoginResponse loginData = userService.googleLogin(request);
        ApiResponse<LoginResponse> response = new ApiResponse<>(true, "Google login successful", loginData);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> forgotPassword(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        java.util.Map<String, Object> data = userService.forgotPassword(email);
        return ResponseEntity.ok(new ApiResponse<>(true, (String) data.get("message"), data));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        String newPassword = request.get("newPassword");
        userService.resetPassword(email, code, newPassword);
        return ResponseEntity.ok(new ApiResponse<>(true, "Password updated successfully. You can now log in with your new password.", null));
    }

    @GetMapping("/google-client-id")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> getGoogleClientId() {
        java.util.Map<String, String> data = new java.util.HashMap<>();
        data.put("clientId", googleClientId != null ? googleClientId.trim() : "");
        return ResponseEntity.ok(new ApiResponse<>(true, "Google Client ID retrieved", data));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(new ApiResponse<>(true, "Users fetched successfully", users));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<ApiResponse<User>> updateUserRole(
            @PathVariable Long id, 
            @RequestBody Map<String, String> body) {
        String role = body.getOrDefault("role", "ROLE_USER");
        User updated = userService.updateUserRole(id, role);
        return ResponseEntity.ok(new ApiResponse<>(true, "User role updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "User deleted successfully", null));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileDTO>> getProfile() {
        String authenticatedEmail = getAuthenticatedEmail();
        UserProfileDTO profile = userService.getUserProfile(authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "User profile fetched successfully", profile));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileDTO>> updateProfile(@RequestBody UserProfileDTO dto) {
        String authenticatedEmail = getAuthenticatedEmail();
        if ((authenticatedEmail == null || authenticatedEmail.isBlank()) && dto.getEmail() != null) {
            authenticatedEmail = dto.getEmail();
        }
        UserProfileDTO updated = userService.updateUserProfile(authenticatedEmail, dto);
        return ResponseEntity.ok(new ApiResponse<>(true, "User profile updated successfully", updated));
    }

    @PostMapping("/profile/picture")
    public ResponseEntity<ApiResponse<UserProfileDTO>> updateProfilePicture(@RequestBody Map<String, String> body) {
        String authenticatedEmail = getAuthenticatedEmail();
        String profileImage = body.get("profileImage");
        UserProfileDTO updated = userService.updateProfilePicture(authenticatedEmail, profileImage);
        return ResponseEntity.ok(new ApiResponse<>(true, "Profile picture updated successfully", updated));
    }

    private String getAuthenticatedEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            return auth.getName();
        }
        return null;
    }
}