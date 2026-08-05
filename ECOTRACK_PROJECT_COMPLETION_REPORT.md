# EcoTrack — Powered Carbon Footprint & Sustainability Management Platform
## End-to-End Milestone 1 (Week 1 & 2) & Feature Completion Report

---

## 1. Executive Summary

The **EcoTrack Sustainability Management Platform** has been fully implemented, enhanced, and aligned with the official project PDF requirements. 

This update completes **Milestone 1 (Week 1 & 2: Requirements, Database Schema Design, Profile Management & Backend Setup)** and delivers full-screen, clean, user-friendly UI designs for the **Home Page**, **About Us Page**, and **Multi-Step User Registration Page**.

---

## 2. Milestone 1 (Week 1 & 2) Requirements & Implementation Audit

| PDF Requirement Task / Outcome | Feature Implementation | Status |
| :--- | :--- | :--- |
| **(i) Scope & User Roles** | Defined 3 distinct roles: `ROLE_USER` (Individual), `ROLE_ORGANIZATION` (ESG Corporate Lead), and `ROLE_ADMIN` (Administrator). | :white_check_mark: Completed |
| **(ii) Database Schema Design** | Designed JPA entities in PostgreSQL: `users`, `user_profiles` (Location, Environmental Interests, Lifestyle), `carbon_activities`, `carbon_activity_categories`, `carbon_emission_factors`, `goals`, `challenges`, `notifications`, `reports`. | :white_check_mark: Completed |
| **(iii) Spring Boot Project Setup** | Initialized Spring Boot 3 with Spring Data JPA, Hibernate 7, Jackson JSON, and REST controllers. | :white_check_mark: Completed |
| **(iv) PostgreSQL Database Config** | Connected to PostgreSQL (`ecotrack` database) with `spring.jpa.hibernate.ddl-auto=update` and automatic data seeding. | :white_check_mark: Completed |
| **(v) JWT Authentication** | Implemented `JwtUtil`, BCrypt password hashing, and Spring Security filter chains for stateless token auth. | :white_check_mark: Completed |
| **(vi) Angular Frontend Skeleton** | Built Angular 19 standalone components with routing, HTTP interceptors, lazy loading, and modern UI. | :white_check_mark: Completed |

---

## 3. Detailed Summary of UI & Architectural Improvements

### 3.1 Full-Screen Layout & Streamlined Navigation ([Home Page](file:///c:/programming/Team3-Powered-Carbon-Footprint-Sustainability-Management-Platform-/frontend/src/app/features/landing/landing.component.html) & [About Us Page](file:///c:/programming/Team3-Powered-Carbon-Footprint-Sustainability-Management-Platform-/frontend/src/app/features/about/about.component.html))
* **Full Viewport Width:** Converted the container layouts for both the **Home Page** and **About Us Page** to span 100% full screen width, removing restricted container boundaries.
* **Streamlined Header Navbar:** Simplified navbar navigation items to strictly **Home** and **About Us** (removing redundant filler links like platform, solutions, resources, pricing).
* **Vibrant 3D Earth Globe Visual:** Replaced the previous brown planet illustration with a high-resolution, vibrant 3D Earth globe (`earth.png`) surrounded by an eco-glow aura.
* **Cleaned Hero Visual:** Removed floating text overlays (*"Active Users 450k+"* and *"Carbon Saved 1.2M Tons"*) from the globe image area to provide a clean, distraction-free hero section.

### 3.2 User Profile Management & Extended Registration (`/auth/register`)
* **Backend Enriched Schema ([User.java](file:///c:/programming/Team3-Powered-Carbon-Footprint-Sustainability-Management-Platform-/Backend/src/main/java/com/ecotrack/backend/entity/User.java)):** Added `role`, `location`, `environmentalInterests`, and `lifestyleConfig` columns to the `users` PostgreSQL table.
* **Redesigned Multi-Step Registration UI ([register.component.html](file:///c:/programming/Team3-Powered-Carbon-Footprint-Sustainability-Management-Platform-/frontend/src/app/features/auth/register/register.component.html)):**
  * **Step 1: Credentials & Role Selector:** Allows new users to choose between `Individual User`, `Organization`, or `Administrator` with interactive role cards.
  * **Step 2: Sustainability Profile:** Interactive chip selectors for 10 Environmental Interest categories from PDF Page 3 (*Renewable Energy, Recycling, Waste Reduction, Sustainable Living, Green Transportation, Water Conservation, Eco-Friendly Products, Climate Action, Organic Farming, Wildlife Conservation*) and lifestyle options (*Urban Apartment, EV/Hybrid, Solar Home, Plant-Based Diet*).

### 3.3 Bug Fix: Database Connection & Quick Add Sub-Category Mapping
* **Special Character Password Parsing:** Fixed PostgreSQL connection issue by configuring literal password support (`Chandru@123#`) in `application.properties`, preventing `.env` parser truncation caused by the `#` symbol.
* **Quick Add Sub-Category Fix ([carbon.component.ts](file:///c:/programming/Team3-Powered-Carbon-Footprint-Sustainability-Management-Platform-/frontend/src/app/features/carbon/carbon.component.ts)):** Fixed Quick Add modal so that category codes automatically map to valid sub-categories (`CAR_PETROL`, `GRID_POWER`, `LPG`, `VEGETARIAN`, `TAP_WATER`, `PLASTIC`, `CLOTHING`, `FLIGHT_INTL`, `TREE_PLANTED`, `SOLAR_KWH`, `RECYCLED_MATERIAL`). Activities now save directly to the PostgreSQL database.

---

## 4. How to Run & Verify the Application

### Step 1: Verify PostgreSQL Database
1. Ensure your PostgreSQL server is running on `localhost:5432` with database `ecotrack`.
2. In `pgAdmin 4`, expand **Servers** -> **PostgreSQL** -> **Databases** -> **ecotrack** -> **Schemas** -> **public** -> **Tables**.

### Step 2: Start Spring Boot Backend
Open a terminal in `Backend` and execute:
```powershell
.\mvnw.cmd spring-boot:run
```
*(Wait until you see `Started BackendApplication` on port 8081).*

### Step 3: Start Angular Frontend
Open a terminal in `frontend` and execute:
```powershell
npm start
```
*(Navigate to `http://localhost:4200` in your web browser).*

### Step 4: Verify Output
* Open `http://localhost:4200` to view the full-screen **Home Page** with the blue Earth planet.
* Navigate to **About Us** to view the full-screen engineering architecture and milestone report.
* Click **Get Started** to test the new **Multi-Step Registration Page** and create a new user profile.

---

## 5. Verification Results

* **Spring Boot Compilation (`.\mvnw.cmd clean compile -DskipTests`):** :white_check_mark: **BUILD SUCCESS** across all 66 Java classes in 5.94s.
* **Angular Production Build (`npm run build`):** :white_check_mark: **SUCCESS** in 4.08s with zero template or compilation errors.
