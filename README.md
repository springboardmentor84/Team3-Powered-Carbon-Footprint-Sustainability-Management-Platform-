# EcoTrack: Carbon Footprint Sustainability Management Platform

EcoTrack is a full-stack sustainability and carbon footprint management platform built with **Spring Boot (Java 21)** and **Angular 19**. It features an 11-category gamified carbon activity tracker, JWT authentication, and AI-powered recommendations.

## 🚀 Quick Start Guide

### 1. Database Setup & Environment Variables
For security reasons, `.env` files are ignored by git. You must create your own `.env` file inside the `Backend/` folder with your PostgreSQL credentials.

1. Navigate to the `Backend` directory.
2. Create a file named `.env` (`Backend/.env`).
3. Add the following credentials to your `.env` file (adjust `DB_PASSWORD` if you did not use `postgres`):

```env
# Backend/.env
DB_URL=jdbc:postgresql://localhost:5432/ecotrack
DB_USERNAME=postgres
DB_PASSWORD=postgres
JWT_SECRET=EcoTrackSuperSecretKeyForJWTAuthentication2026!
```

4. Open **pgAdmin 4** on your machine and create a new database named `ecotrack`.

### 2. Run the Spring Boot Backend
Open a terminal and run the backend:
```bash
cd Backend
.\mvnw.cmd spring-boot:run
```
*Note: Hibernate will automatically create all tables and seed the database with 11 default sustainability categories, emission factors, and demo user accounts.*

### 3. Run the Angular Frontend
Open a second terminal and start the frontend:
```bash
cd frontend
npm install
npm start
```

### 4. Access the Application
Go to `http://localhost:4200` in your web browser. 
You can instantly log in using the automatically seeded demo credentials:
* **Email:** `demo@ecotrack.com`
* **Password:** `password123`

---
For a complete breakdown of the project architecture and features, please see the `ECOTRACK_PROJECT_COMPLETION_REPORT.md` file.
