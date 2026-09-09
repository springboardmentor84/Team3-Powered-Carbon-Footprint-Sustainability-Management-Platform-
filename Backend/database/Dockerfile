# Use official lightweight PostgreSQL Alpine image
FROM postgres:15-alpine

# Set environment variables for default DB name and user
ENV POSTGRES_DB=ecotrack_db
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres

# Copy database schema script into PostgreSQL auto-init directory
# Scripts in /docker-entrypoint-initdb.d/ run automatically when container starts for the first time
COPY schema.sql /docker-entrypoint-initdb.d/

EXPOSE 5432
