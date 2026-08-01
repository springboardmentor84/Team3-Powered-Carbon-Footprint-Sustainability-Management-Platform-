package com.ecotrack.backend.service;

import com.ecotrack.backend.dto.CarbonEmissionRequest;
import com.ecotrack.backend.dto.CarbonEmissionResponse;

import java.util.List;

public interface CarbonEmissionService {

    CarbonEmissionResponse addEmission(CarbonEmissionRequest request, String authenticatedEmail);

    List<CarbonEmissionResponse> getAllEmissions(String authenticatedEmail);

    CarbonEmissionResponse getEmissionById(Long id, String authenticatedEmail);

    CarbonEmissionResponse updateEmission(Long id, CarbonEmissionRequest request, String authenticatedEmail);

    void deleteEmission(Long id, String authenticatedEmail);
}
