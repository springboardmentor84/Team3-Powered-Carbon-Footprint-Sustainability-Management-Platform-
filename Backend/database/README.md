# EcoTrack Database Architecture (PostgreSQL)

This folder contains the PostgreSQL database schema and initial seed data for the **EcoTrack: AI-Powered Carbon Footprint & Sustainability Management Platform**.

---

## 📁 Directory Layout
```text
Backend/
└── database/
    ├── schema.sql      # PostgreSQL DDL script (Tables, FKs, Indexes & Seed Data)
    └── README.md       # Database design documentation & Spring Boot integration notes
```

---

## 🗄️ Database Schema Summary (13 Tables)

The database schema is organized into key functional modules:

### 1. User & Authentication Module
* **`users`**: Stores user authentication credentials, role (`ROLE_USER`, `ROLE_ADMIN`), OAuth2 providers (`LOCAL`, `GOOGLE`), and account status.
* **`profiles`**: Stores profile information, location, cumulative `eco_score`, total reward points, and personal lifestyle settings.
* **`user_interests`**: Junction table mapping user preferences across interest categories (e.g., Renewable Energy, Green Transportation, Waste Reduction).

### 2. Carbon Footprint Tracking Module
* **`carbon_entries`**: Daily carbon emission activity logs recorded by users. Covers categories such as Transportation, Electricity Usage, Fuel Consumption, Food Consumption, Waste Generation, Water Usage, Online Shopping, Travel Activities.

### 3. Sustainability Goal Management Module
* **`goals`**: Tracks sustainability targets (e.g., target carbon reduction, target date, completion status).
* **`goal_progress`**: Records incremental updates and milestone checkpoints for active goals.

### 4. AI Recommendation System
* **`ai_recommendations`**: Stores AI-generated tailored recommendations based on user carbon habits, lifestyle, and goal progress.

### 5. Community Challenge & Gamification Module
* **`challenges`**: Public/community eco challenges (e.g., Plastic-Free Week, Cycle To Work, Tree Plantation Drive).
* **`challenge_participants`**: Tracks user enrollment, progress, completion state, and reward claims for challenges.
* **`badges`**: Master catalog of achievement badges (Green Beginner, Eco Warrior, Sustainability Champion, Climate Hero, Planet Protector).
* **`user_badges`**: Junction table tracking unlocked user badges and earn timestamps.

### 6. System Services & Reporting Module
* **`notifications`**: Stores goal reminders, challenge alerts, AI recommendation alerts, and system notifications.
* **`reports`**: Stores exported report metadata and JSON structure for PDF/Excel downloads.

---

## 🚀 How to Run / Import SQL Schema in PostgreSQL

### Option A: Using PostgreSQL CLI (`psql`)
```bash
psql -U postgres -d ecotrack_db -f schema.sql
```

### Option B: Using pgAdmin or DBeaver
1. Connect to your PostgreSQL database instance (`ecotrack_db`).
2. Open a new **SQL Query Tool** window.
3. Paste the contents of `Backend/database/schema.sql` and run **Execute**.

---

## 🍃 Spring Boot Integration Guide (For Teammate)

When your teammate initializes the Spring Boot backend application, they can connect to this database using the following settings:

### `application.properties` Config:
```properties
# PostgreSQL Database Connection
spring.datasource.url=jdbc:postgresql://localhost:5432/ecotrack_db
spring.datasource.username=postgres
spring.datasource.password=your_password
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA / Hibernate Configuration
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.hibernate.naming.physical-strategy=org.hibernate.boot.model.naming.CamelCaseToSnakeCaseNamingStrategy

# Automatically populate initial seed data on startup (Optional)
spring.sql.init.mode=always
spring.sql.init.data-locations=classpath:Backend/database/schema.sql
```

---

## 📌 Entity Mapping Reference Table

| SQL Table Name | Suggested Spring Boot JPA Entity Class | Key Features |
| :--- | :--- | :--- |
| `users` | `User.java` | `@Entity`, `@Table(name="users")`, JWT/OAuth fields |
| `profiles` | `Profile.java` | `@OneToOne` with `User` entity |
| `user_interests` | `UserInterest.java` | `@ManyToOne` with `User` entity |
| `carbon_entries` | `CarbonEntry.java` | Carbon emission tracking logs |
| `goals` | `Goal.java` | `@OneToMany` with `GoalProgress` |
| `goal_progress` | `GoalProgress.java` | `@ManyToOne` with `Goal` entity |
| `challenges` | `Challenge.java` | `@OneToMany` with `ChallengeParticipant` |
| `challenge_participants` | `ChallengeParticipant.java` | Junction table for user progress |
| `badges` | `Badge.java` | Master table for reward badges |
| `user_badges` | `UserBadge.java` | Unlocked user badges |
| `ai_recommendations` | `AiRecommendation.java` | Personal AI reduction tips |
| `notifications` | `Notification.java` | System & goal notification alerts |
| `reports` | `Report.java` | PDF/Excel generated reports |
