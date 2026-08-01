package com.ecotrack.backend.controller;

import com.ecotrack.backend.dto.ApiResponse;
import com.ecotrack.backend.dto.LoginRequest;
import com.ecotrack.backend.dto.LoginResponse;
import com.ecotrack.backend.dto.UserRegistrationRequest;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.service.UserService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<User>> registerUser(@RequestBody UserRegistrationRequest request) {
        User savedUser = userService.registerUser(request);
        
        // Naya ApiResponse format
        ApiResponse<User> response = new ApiResponse<>(true, "User registered successfully", savedUser);
        
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse loginData = userService.loginUser(request);
        
        // Naya ApiResponse format
        ApiResponse<LoginResponse> response = new ApiResponse<>(true, "Login successful", loginData);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<String>> profile() {
        ApiResponse<String> response = new ApiResponse<>(true, "Profile fetched successfully", "Welcome to EcoTrack Secure API");
        return ResponseEntity.ok(response);
    }
}