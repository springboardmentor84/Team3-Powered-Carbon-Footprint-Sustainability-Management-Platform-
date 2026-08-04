package com.ecotrack.backend.activity.config;

import com.ecotrack.backend.activity.entity.CarbonActivityCategory;
import com.ecotrack.backend.activity.entity.CarbonEmissionFactor;
import com.ecotrack.backend.activity.repository.CarbonActivityCategoryRepository;
import com.ecotrack.backend.activity.repository.CarbonEmissionFactorRepository;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class CarbonActivityDataSeeder implements CommandLineRunner {

    private final CarbonActivityCategoryRepository categoryRepository;
    private final CarbonEmissionFactorRepository factorRepository;
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (categoryRepository.count() == 0) {
            log.info("Seeding 11 Carbon Activity Categories into PostgreSQL...");

            List<CarbonActivityCategory> categories = List.of(
                    createCat("TRANSPORTATION", "Transportation", "Commute, trips, and vehicle usage", "bi-car-front", "miles", false),
                    createCat("ELECTRICITY", "Electricity", "Home or office electrical energy consumption", "bi-lightning-charge", "kWh", false),
                    createCat("COOKING_FUEL", "Cooking Fuel", "LPG, PNG, electric stoves, and biogas usage", "bi-fire", "kg", false),
                    createCat("FOOD_CONSUMPTION", "Food Consumption", "Meals, dietary impact, and grocery types", "bi-egg-fried", "meals", false),
                    createCat("WATER_USAGE", "Water Usage", "Laundry, dish washing, showers, and gardening", "bi-droplet", "litres", false),
                    createCat("WASTE_MANAGEMENT", "Waste Management", "Plastic, paper, glass, and electronic waste", "bi-trash3", "kg", false),
                    createCat("SHOPPING", "Shopping", "Electronics, clothing, furniture, and groceries", "bi-bag-check", "items", false),
                    createCat("TRAVEL", "Travel", "Flights, hotels, trains, and cabs", "bi-airplane", "miles", false),
                    createCat("TREE_PLANTATION", "Tree Plantation", "Trees planted and reforestation initiatives", "bi-tree", "trees", true),
                    createCat("RECYCLING", "Recycling", "Recycled materials and waste diversion", "bi-recycle", "kg", true),
                    createCat("RENEWABLE_ENERGY", "Renewable Energy", "Solar, wind, and green electricity produced", "bi-sun", "kWh", true)
            );
            categoryRepository.saveAll(categories);
            log.info("Successfully seeded {} categories.", categories.size());
        }

        if (factorRepository.count() == 0) {
            log.info("Seeding default Emission Factors for all 11 categories...");

            List<CarbonEmissionFactor> factors = List.of(
                    // 1. TRANSPORTATION
                    createFactor("TRANSPORTATION", "CAR_PETROL", "0.35", "miles"),
                    createFactor("TRANSPORTATION", "CAR_EV", "0.12", "miles"),
                    createFactor("TRANSPORTATION", "BUS", "0.08", "miles"),
                    createFactor("TRANSPORTATION", "METRO", "0.04", "miles"),
                    createFactor("TRANSPORTATION", "TRAIN", "0.05", "miles"),
                    createFactor("TRANSPORTATION", "FLIGHT", "0.25", "miles"),
                    createFactor("TRANSPORTATION", "BIKE", "0.15", "miles"),
                    createFactor("TRANSPORTATION", "WALKING", "0.00", "miles"),

                    // 2. ELECTRICITY
                    createFactor("ELECTRICITY", "GRID_POWER", "0.39", "kWh"),
                    createFactor("ELECTRICITY", "RENEWABLE", "0.05", "kWh"),

                    // 3. COOKING FUEL
                    createFactor("COOKING_FUEL", "LPG", "2.98", "kg"),
                    createFactor("COOKING_FUEL", "PNG", "2.05", "m3"),
                    createFactor("COOKING_FUEL", "ELECTRIC_STOVE", "0.39", "kWh"),
                    createFactor("COOKING_FUEL", "BIOGAS", "0.10", "kg"),
                    createFactor("COOKING_FUEL", "WOOD", "1.80", "kg"),

                    // 4. FOOD CONSUMPTION
                    createFactor("FOOD_CONSUMPTION", "MEAT", "2.50", "meals"),
                    createFactor("FOOD_CONSUMPTION", "BEEF", "4.50", "meals"),
                    createFactor("FOOD_CONSUMPTION", "CHICKEN", "1.80", "meals"),
                    createFactor("FOOD_CONSUMPTION", "VEGETARIAN", "0.80", "meals"),
                    createFactor("FOOD_CONSUMPTION", "VEGAN", "0.30", "meals"),
                    createFactor("FOOD_CONSUMPTION", "FAST_FOOD", "2.10", "meals"),

                    // 5. WATER USAGE
                    createFactor("WATER_USAGE", "TAP_WATER", "0.001", "litres"),
                    createFactor("WATER_USAGE", "HOT_WATER", "0.015", "litres"),

                    // 6. WASTE MANAGEMENT
                    createFactor("WASTE_MANAGEMENT", "PLASTIC", "2.10", "kg"),
                    createFactor("WASTE_MANAGEMENT", "PAPER", "0.90", "kg"),
                    createFactor("WASTE_MANAGEMENT", "FOOD_WASTE", "0.50", "kg"),
                    createFactor("WASTE_MANAGEMENT", "ELECTRONIC_WASTE", "3.50", "kg"),

                    // 7. SHOPPING
                    createFactor("SHOPPING", "CLOTHING", "12.00", "items"),
                    createFactor("SHOPPING", "ELECTRONICS", "85.00", "items"),
                    createFactor("SHOPPING", "GROCERIES", "3.50", "items"),

                    // 8. TRAVEL
                    createFactor("TRAVEL", "HOTEL", "25.00", "nights"),
                    createFactor("TRAVEL", "FLIGHT_INTL", "0.28", "miles"),

                    // 9. TREE PLANTATION (OFFSET)
                    createFactor("TREE_PLANTATION", "TREE_PLANTED", "22.00", "trees"),

                    // 10. RECYCLING (OFFSET)
                    createFactor("RECYCLING", "RECYCLED_MATERIAL", "1.50", "kg"),

                    // 11. RENEWABLE ENERGY (OFFSET)
                    createFactor("RENEWABLE_ENERGY", "SOLAR_KWH", "0.35", "kWh")
            );
            factorRepository.saveAll(factors);
            log.info("Successfully seeded {} emission factors.", factors.size());
        }

        if (!userRepository.existsByEmail("demo@ecotrack.com")) {
            log.info("Seeding default demo user into PostgreSQL...");
            User demoUser = User.builder()
                    .fullName("Alex Rivers")
                    .email("demo@ecotrack.com")
                    .password(passwordEncoder.encode("password123"))
                    .rewardPoints(1240)
                    .badgeName("Level 12 Explorer")
                    .build();
            userRepository.save(demoUser);
            log.info("Successfully seeded demo user: demo@ecotrack.com / password123");
        }

        if (!userRepository.existsByEmail("user@ecotrack.com")) {
            User testUser = User.builder()
                    .fullName("Alex Rivers")
                    .email("user@ecotrack.com")
                    .password(passwordEncoder.encode("demo123"))
                    .rewardPoints(1240)
                    .badgeName("Level 12 Explorer")
                    .build();
            userRepository.save(testUser);
            log.info("Successfully seeded test user: user@ecotrack.com / demo123");
        }
    }

    private CarbonActivityCategory createCat(String code, String name, String description, String icon, String unit, boolean isOffset) {
        return CarbonActivityCategory.builder()
                .code(code)
                .name(name)
                .description(description)
                .icon(icon)
                .defaultUnit(unit)
                .isOffset(isOffset)
                .build();
    }

    private CarbonEmissionFactor createFactor(String catCode, String subCat, String value, String unit) {
        return CarbonEmissionFactor.builder()
                .categoryCode(catCode)
                .subCategory(subCat)
                .factorValue(new BigDecimal(value))
                .unit(unit)
                .region("GLOBAL")
                .effectiveDate(LocalDate.now())
                .isActive(true)
                .build();
    }
}
