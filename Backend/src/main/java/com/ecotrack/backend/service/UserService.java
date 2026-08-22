package com.ecotrack.backend.service;

import com.ecotrack.backend.dto.LoginRequest;
import com.ecotrack.backend.dto.LoginResponse;
import com.ecotrack.backend.dto.UserRegistrationRequest;
import com.ecotrack.backend.entity.User;

public interface UserService {

    User registerUser(UserRegistrationRequest request);

    LoginResponse loginUser(LoginRequest request);

    java.util.List<User> getAllUsers();

    User updateUserRole(Long id, String role);

    void deleteUser(Long id);
}