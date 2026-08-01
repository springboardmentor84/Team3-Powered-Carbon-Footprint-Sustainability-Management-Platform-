package com.ecotrack.backend.service.impl;

import com.ecotrack.backend.dto.CarbonEmissionRequest;
import com.ecotrack.backend.dto.CarbonEmissionResponse;
import com.ecotrack.backend.entity.CarbonEmission;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.exception.ResourceNotFoundException;
import com.ecotrack.backend.repository.CarbonEmissionRepository;
import com.ecotrack.backend.repository.UserRepository;
import com.ecotrack.backend.service.CarbonEmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CarbonEmissionServiceImpl implements CarbonEmissionService {

    private final CarbonEmissionRepository carbonEmissionRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CarbonEmissionResponse addEmission(CarbonEmissionRequest request, String authenticatedEmail) {
        User user = findUserByEmail(authenticatedEmail);

        CarbonEmission emission = CarbonEmission.builder()
                .user(user)
                .transportationEmission(request.getTransportationEmission())
                .electricityEmission(request.getElectricityEmission())
                .foodEmission(request.getFoodEmission())
                .wasteEmission(request.getWasteEmission())
                .build();

        CarbonEmission savedEmission = carbonEmissionRepository.save(emission);
        return mapToResponse(savedEmission);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CarbonEmissionResponse> getAllEmissions(String authenticatedEmail) {
        User user = findUserByEmail(authenticatedEmail);
        return carbonEmissionRepository.findByUserId(user.getId()).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CarbonEmissionResponse getEmissionById(Long id, String authenticatedEmail) {
        User user = findUserByEmail(authenticatedEmail);
        CarbonEmission emission = carbonEmissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emission record not found"));

        if (!emission.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Emission record not found");
        }

        return mapToResponse(emission);
    }

    @Override
    @Transactional
    public CarbonEmissionResponse updateEmission(Long id, CarbonEmissionRequest request, String authenticatedEmail) {
        User user = findUserByEmail(authenticatedEmail);
        CarbonEmission emission = carbonEmissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emission record not found"));

        if (!emission.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Emission record not found");
        }

        emission.setTransportationEmission(request.getTransportationEmission());
        emission.setElectricityEmission(request.getElectricityEmission());
        emission.setFoodEmission(request.getFoodEmission());
        emission.setWasteEmission(request.getWasteEmission());
        emission.calculateTotalEmission();

        CarbonEmission updatedEmission = carbonEmissionRepository.save(emission);
        return mapToResponse(updatedEmission);
    }

    @Override
    @Transactional
    public void deleteEmission(Long id, String authenticatedEmail) {
        User user = findUserByEmail(authenticatedEmail);
        CarbonEmission emission = carbonEmissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emission record not found"));

        if (!emission.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Emission record not found");
        }

        carbonEmissionRepository.delete(emission);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private CarbonEmissionResponse mapToResponse(CarbonEmission emission) {
        return CarbonEmissionResponse.builder()
                .id(emission.getId())
                .userId(emission.getUser().getId())
                .transportationEmission(emission.getTransportationEmission())
                .electricityEmission(emission.getElectricityEmission())
                .foodEmission(emission.getFoodEmission())
                .wasteEmission(emission.getWasteEmission())
                .totalEmission(emission.getTotalEmission())
                .createdAt(emission.getCreatedAt())
                .build();
    }
}
