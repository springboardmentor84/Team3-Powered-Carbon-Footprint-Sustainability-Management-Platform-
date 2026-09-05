package com.ecotrack.backend.service;

import com.ecotrack.backend.dto.GoogleLoginRequest;
import com.ecotrack.backend.dto.LoginRequest;
import com.ecotrack.backend.dto.LoginResponse;
import com.ecotrack.backend.dto.UserProfileDTO;
import com.ecotrack.backend.dto.UserRegistrationRequest;
import com.ecotrack.backend.entity.User;

import java.util.List;
import java.util.Map;

public interface UserService {

    User registerUser(UserRegistrationRequest request);

    LoginResponse loginUser(LoginRequest request);

    LoginResponse googleLogin(GoogleLoginRequest request);

    List<User> getAllUsers();

    User updateUserRole(Long id, String role);

    void deleteUser(Long id);

    UserProfileDTO getUserProfile(String authenticatedEmail);

    UserProfileDTO updateUserProfile(String authenticatedEmail, UserProfileDTO dto);

    UserProfileDTO updateProfilePicture(String authenticatedEmail, String profileImage);

    Map<String, Object> forgotPassword(String email);

    void resetPassword(String email, String code, String newPassword);
}