package com.ecotrack.backend.service.impl;

import com.ecotrack.backend.dto.DashboardResponse;
import com.ecotrack.backend.entity.CarbonEmission;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.repository.CarbonEmissionRepository;
import com.ecotrack.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceImplTest {

    @Mock
    private CarbonEmissionRepository carbonEmissionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    @Test
    void shouldAggregateDashboardMetricsForUser() {
        User user = User.builder()
                .id(1L)
                .email("user@example.com")
                .build();

        CarbonEmission firstEmission = CarbonEmission.builder()
                .user(user)
                .transportationEmission(new BigDecimal("8.00"))
                .electricityEmission(new BigDecimal("4.00"))
                .foodEmission(new BigDecimal("2.00"))
                .wasteEmission(new BigDecimal("1.00"))
                .createdAt(LocalDateTime.now())
                .build();
        firstEmission.calculateTotalEmission();

        CarbonEmission secondEmission = CarbonEmission.builder()
                .user(user)
                .transportationEmission(new BigDecimal("2.00"))
                .electricityEmission(new BigDecimal("3.00"))
                .foodEmission(new BigDecimal("1.00"))
                .wasteEmission(new BigDecimal("4.00"))
                .createdAt(LocalDateTime.now())
                .build();
        secondEmission.calculateTotalEmission();

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(carbonEmissionRepository.findByUserId(1L)).thenReturn(List.of(firstEmission, secondEmission));

        DashboardResponse response = dashboardService.getDashboard("user@example.com");

        assertEquals(new BigDecimal("25.00"), response.getTotalCarbonEmission());
        assertEquals("TRANSPORTATION", response.getHighestEmissionCategory());
        assertEquals("FOOD", response.getLowestEmissionCategory());
    }
}
