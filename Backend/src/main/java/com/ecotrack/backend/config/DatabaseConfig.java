package com.ecotrack.backend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    @Value("${DB_URL:jdbc:postgresql://localhost:5432/ecotrack}")
    private String localDbUrl;

    @Value("${DB_USERNAME:postgres}")
    private String localDbUsername;

    @Value("${DB_PASSWORD:postgres}")
    private String localDbPassword;

    @Bean
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        String dbUrl = System.getenv("DATABASE_URL");

        if (dbUrl != null && (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://"))) {
            // Parse Railway DATABASE_URL natively
            try {
                String httpUrl = dbUrl.replace("postgres://", "http://").replace("postgresql://", "http://");
                URI uri = new URI(httpUrl);
                
                String userInfo = uri.getUserInfo();
                if (userInfo != null) {
                    int colonIndex = userInfo.indexOf(':');
                    if (colonIndex != -1) {
                        config.setUsername(userInfo.substring(0, colonIndex));
                        // The password is everything after the first colon, preserving any other colons
                        config.setPassword(userInfo.substring(colonIndex + 1));
                    } else {
                        config.setUsername(userInfo);
                    }
                }
                
                String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + 
                                 (uri.getPort() == -1 ? 5432 : uri.getPort()) + uri.getPath();
                config.setJdbcUrl(jdbcUrl);
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse DATABASE_URL", e);
            }
        } else {
            // Fallback to local .env configuration
            config.setJdbcUrl(localDbUrl);
            config.setUsername(localDbUsername);
            config.setPassword(localDbPassword);
        }

        config.setDriverClassName("org.postgresql.Driver");
        return new HikariDataSource(config);
    }
}
