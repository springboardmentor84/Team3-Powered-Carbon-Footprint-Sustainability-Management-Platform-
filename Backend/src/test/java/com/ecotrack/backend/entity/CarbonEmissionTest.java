package com.ecotrack.backend.entity;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CarbonEmissionTest {

    @Test
    void shouldCalculateTotalEmissionFromAllComponents() {
        CarbonEmission emission = CarbonEmission.builder()
                .transportationEmission(new BigDecimal("10.50"))
                .electricityEmission(new BigDecimal("5.25"))
                .foodEmission(new BigDecimal("3.75"))
                .wasteEmission(new BigDecimal("2.00"))
                .build();

        emission.calculateTotalEmission();

        assertEquals(new BigDecimal("21.50"), emission.getTotalEmission());
    }
}
