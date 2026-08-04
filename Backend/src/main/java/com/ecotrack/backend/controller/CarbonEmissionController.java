package com.ecotrack.backend.controller;

import com.ecotrack.backend.dto.ApiResponse;
import com.ecotrack.backend.dto.CarbonEmissionRequest;
import com.ecotrack.backend.dto.CarbonEmissionResponse;
import com.ecotrack.backend.service.CarbonEmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emissions")
@RequiredArgsConstructor
public class CarbonEmissionController {

    private final CarbonEmissionService carbonEmissionService;

    @PostMapping
    public ResponseEntity<ApiResponse<CarbonEmissionResponse>> addEmission(@Valid @RequestBody CarbonEmissionRequest request) {
        String authenticatedEmail = getAuthenticatedEmail();
        CarbonEmissionResponse response = carbonEmissionService.addEmission(request, authenticatedEmail);
        return new ResponseEntity<>(new ApiResponse<>(true, "Carbon emission added successfully", response), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CarbonEmissionResponse>>> getAllEmissions() {
        String authenticatedEmail = getAuthenticatedEmail();
        List<CarbonEmissionResponse> emissions = carbonEmissionService.getAllEmissions(authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Emissions fetched successfully", emissions));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CarbonEmissionResponse>> getEmissionById(@PathVariable Long id) {
        String authenticatedEmail = getAuthenticatedEmail();
        CarbonEmissionResponse emission = carbonEmissionService.getEmissionById(id, authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Emission fetched successfully", emission));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CarbonEmissionResponse>> updateEmission(@PathVariable Long id,
                                                                              @Valid @RequestBody CarbonEmissionRequest request) {
        String authenticatedEmail = getAuthenticatedEmail();
        CarbonEmissionResponse updatedEmission = carbonEmissionService.updateEmission(id, request, authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Emission updated successfully", updatedEmission));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEmission(@PathVariable Long id) {
        String authenticatedEmail = getAuthenticatedEmail();
        carbonEmissionService.deleteEmission(id, authenticatedEmail);
        return ResponseEntity.ok(new ApiResponse<>(true, "Emission deleted successfully", null));
    }

    private String getAuthenticatedEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }
}
