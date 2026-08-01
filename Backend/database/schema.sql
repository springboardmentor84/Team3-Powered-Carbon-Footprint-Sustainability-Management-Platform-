-- =============================================================================
-- EcoTrack: AI-Powered Carbon Footprint & Sustainability Management Platform
-- PostgreSQL Database Schema for Spring Boot Backend Integration
-- =============================================================================
-- Database Engine: PostgreSQL 14+
-- Naming Convention: snake_case (Fully compatible with Spring Data JPA & Hibernate)
-- =============================================================================

-- Drop tables if they already exist (in reverse order of dependency for clean reset)
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS ai_recommendations CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS challenge_participants CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS goal_progress CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS carbon_entries CASCADE;
DROP TABLE IF EXISTS user_interests CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- -----------------------------------------------------------------------------
-- 1. USERS TABLE
-- Stores authentication data for JWT & OAuth2 login (Roles: ROLE_USER, ROLE_ADMIN)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),                  -- NULL if registered via OAuth2
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ROLE_USER', -- ROLE_USER or ROLE_ADMIN
    auth_provider VARCHAR(50) DEFAULT 'LOCAL',    -- LOCAL, GOOGLE, etc.
    provider_id VARCHAR(255),                     -- External ID for OAuth2
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. PROFILES TABLE
-- User profile details, sustainability score, lifestyle settings & preferences
-- -----------------------------------------------------------------------------
CREATE TABLE profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    profile_picture_url VARCHAR(500),
    location VARCHAR(150),
    eco_score INT NOT NULL DEFAULT 0,            -- Eco Score tracking system
    total_reward_points INT NOT NULL DEFAULT 0,  -- Rewards points accumulated
    lifestyle_config TEXT,                       -- JSON/Text setup for user habits
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. USER INTERESTS TABLE
-- Environmental interest categories (Renewable Energy, Recycling, Waste Reduction, etc.)
-- -----------------------------------------------------------------------------
CREATE TABLE user_interests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interest_category VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_interest UNIQUE (user_id, interest_category)
);

-- -----------------------------------------------------------------------------
-- 4. CARBON ENTRIES TABLE
-- Carbon emission records tracked by user across various categories
-- Categories: Transportation, Electricity Usage, Fuel Consumption, Food Consumption,
--              Waste Generation, Water Usage, Online Shopping, Travel Activities
-- -----------------------------------------------------------------------------
CREATE TABLE carbon_entries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    activity_amount NUMERIC(10, 2) NOT NULL,     -- e.g., 25.5 (km, kWh, kg, liters)
    unit VARCHAR(50) NOT NULL,                    -- e.g., 'km', 'kWh', 'kg', 'liters'
    calculated_co2_kg NUMERIC(10, 2) NOT NULL,  -- Calculated carbon emission in kg CO2e
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. GOALS TABLE
-- Sustainability goal management (Reduce Emissions, Save Water, Plant Trees, etc.)
-- -----------------------------------------------------------------------------
CREATE TABLE goals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(100) NOT NULL,             -- e.g., 'REDUCE_CARBON', 'REDUCE_WATER'
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_value NUMERIC(10, 2) NOT NULL,
    current_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED, FAILED
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 6. GOAL PROGRESS TABLE
-- Fine-grained progress logs/milestones recorded for individual goals
-- -----------------------------------------------------------------------------
CREATE TABLE goal_progress (
    id BIGSERIAL PRIMARY KEY,
    goal_id BIGINT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    progress_value NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 7. CHALLENGES TABLE
-- Community challenges created by Admins/Users
-- Categories: Plastic-Free Week, Cycle To Work, Energy Saving, Tree Plantation, etc.
-- -----------------------------------------------------------------------------
CREATE TABLE challenges (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    target_metric VARCHAR(100),
    target_value NUMERIC(10, 2),
    reward_points INT NOT NULL DEFAULT 100,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- UPCOMING, ACTIVE, COMPLETED, CANCELLED
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 8. CHALLENGE PARTICIPANTS TABLE
-- Tracks users joining and completing community challenges
-- -----------------------------------------------------------------------------
CREATE TABLE challenge_participants (
    id BIGSERIAL PRIMARY KEY,
    challenge_id BIGINT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    current_progress NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'JOINED', -- JOINED, IN_PROGRESS, COMPLETED
    reward_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    CONSTRAINT uq_user_challenge UNIQUE (user_id, challenge_id)
);

-- -----------------------------------------------------------------------------
-- 9. BADGES TABLE
-- Catalog of eco achievements and badges (Green Beginner, Eco Warrior, etc.)
-- -----------------------------------------------------------------------------
CREATE TABLE badges (
    id BIGSERIAL PRIMARY KEY,
    badge_name VARCHAR(100) NOT NULL UNIQUE,
    badge_category VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    required_points INT NOT NULL DEFAULT 0
);

-- -----------------------------------------------------------------------------
-- 10. USER BADGES TABLE
-- Badges unlocked by users as gamification rewards
-- -----------------------------------------------------------------------------
CREATE TABLE user_badges (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id BIGINT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_badge UNIQUE (user_id, badge_id)
);

-- -----------------------------------------------------------------------------
-- 11. AI RECOMMENDATIONS TABLE
-- AI-generated personalized recommendations for users to lower carbon footprint
-- -----------------------------------------------------------------------------
CREATE TABLE ai_recommendations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    potential_reduction_co2_kg NUMERIC(10, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, ACCEPTED, DISMISSED
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 12. NOTIFICATIONS TABLE
-- Goal reminders, challenge alerts, AI recommendation alerts, and system notices
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,        -- GOAL_REMINDER, CHALLENGE_ALERT, RECOMMENDATION, SYSTEM
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 13. REPORTS TABLE
-- Generated PDF/Excel reports metadata for user or admin download
-- -----------------------------------------------------------------------------
CREATE TABLE reports (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_name VARCHAR(200) NOT NULL,
    report_type VARCHAR(50) NOT NULL,            -- CARBON_FOOTPRINT, GOAL_ACHIEVEMENT, SUSTAINABILITY
    file_url VARCHAR(500),
    report_data_json JSONB,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR FAST QUERY PERFORMANCE
-- =============================================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_carbon_entries_user_date ON carbon_entries(user_id, activity_date);
CREATE INDEX idx_carbon_entries_category ON carbon_entries(category);
CREATE INDEX idx_goals_user_status ON goals(user_id, status);
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_ai_rec_user_status ON ai_recommendations(user_id, status);

-- =============================================================================
-- SAMPLE SEED DATA FOR TESTING & DEVELOPMENT
-- =============================================================================

-- Seed Admin and Sample User
INSERT INTO users (email, password_hash, full_name, role, auth_provider) VALUES
('admin@ecotrack.com', '$2a$10$abcdef1234567890BCDEFG', 'EcoTrack Admin', 'ROLE_ADMIN', 'LOCAL'),
('user@ecotrack.com', '$2a$10$abcdef1234567890BCDEFG', 'Green Citizen', 'ROLE_USER', 'LOCAL');

-- Seed User Profile
INSERT INTO profiles (user_id, bio, location, eco_score, total_reward_points) VALUES
(2, 'Eco enthusiast passionate about reducing carbon emission', 'San Francisco, CA', 150, 250);

-- Seed Interests
INSERT INTO user_interests (user_id, interest_category) VALUES
(2, 'Green Transportation'),
(2, 'Recycling'),
(2, 'Renewable Energy');

-- Seed Badges Catalog
INSERT INTO badges (badge_name, badge_category, description, required_points) VALUES
('Green Beginner', 'Milestone', 'Completed first carbon entry', 10),
('Eco Warrior', 'Milestone', 'Reduced carbon emission by 50kg', 100),
('Sustainability Champion', 'Milestone', 'Completed 5 sustainability goals', 250),
('Climate Hero', 'Milestone', 'Participated in 3 community challenges', 500),
('Planet Protector', 'Legendary', 'Achieved top 1% Eco Score', 1000);

-- Seed Sample Challenges
INSERT INTO challenges (title, description, category, target_metric, target_value, reward_points, start_date, end_date, created_by) VALUES
('Plastic-Free Week', 'Avoid single-use plastics for 7 consecutive days', 'Waste Reduction', 'Days', 7.00, 150, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 1),
('Cycle To Work', 'Commute by bicycle or public transit', 'Green Transportation', 'Distance (km)', 50.00, 200, CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', 1);

-- Seed Sample Goal
INSERT INTO goals (user_id, goal_type, title, description, target_value, unit, target_date) VALUES
(2, 'REDUCE_CARBON', 'Cut Monthly Transport Carbon', 'Reduce personal commute emissions by 20%', 100.00, 'kg CO2e', CURRENT_DATE + INTERVAL '30 days');

-- Seed Sample Carbon Entry
INSERT INTO carbon_entries (user_id, category, subcategory, activity_amount, unit, calculated_co2_kg, activity_date, notes) VALUES
(2, 'Transportation', 'Gasoline Car', 45.00, 'km', 8.55, CURRENT_DATE, 'Daily highway commute');

-- Seed Sample AI Recommendation
INSERT INTO ai_recommendations (user_id, title, description, category, potential_reduction_co2_kg) VALUES
(2, 'Switch to Public Bus for Commute', 'Taking the public bus twice a week can reduce your monthly transportation emissions significantly.', 'Transportation', 18.50);
