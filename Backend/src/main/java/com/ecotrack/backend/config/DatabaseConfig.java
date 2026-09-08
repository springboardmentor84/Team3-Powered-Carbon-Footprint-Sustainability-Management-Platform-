package com.ecotrack.backend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${spring.datasource.username:postgres}")
    private String dbUsername;

    @Value("${spring.datasource.password:postgres}")
    private String dbPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();

        String url = dbUrl;
        String user = dbUsername;
        String pass = dbPassword;

        if (url != null && !url.trim().isEmpty()) {
            String trimmedUrl = url.trim();
            // Handle postgresql:// or postgres:// from Railway / Heroku
            if (trimmedUrl.startsWith("postgres://") || trimmedUrl.startsWith("postgresql://")) {
                try {
                    String httpUrl = trimmedUrl.replace("postgres://", "http://").replace("postgresql://", "http://");
                    URI uri = new URI(httpUrl);
                    String host = uri.getHost();
                    int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                    String path = uri.getPath();

                    url = "jdbc:postgresql://" + host + ":" + port + path;

                    if (uri.getUserInfo() != null) {
                        String[] userInfo = uri.getUserInfo().split(":");
                        if (userInfo.length > 0 && (user == null || user.isEmpty() || user.equals("postgres"))) {
                            user = userInfo[0];
                        }
                        if (userInfo.length > 1 && (pass == null || pass.isEmpty() || pass.equals("postgres"))) {
                            pass = userInfo[1];
                        }
                    }
                } catch (Exception e) {
                    if (!trimmedUrl.startsWith("jdbc:")) {
                        url = "jdbc:" + trimmedUrl;
                    }
                }
            } else if (!trimmedUrl.startsWith("jdbc:")) {
                url = "jdbc:" + trimmedUrl;
            }
        }

        config.setJdbcUrl(url);
        config.setUsername(user);
        config.setPassword(pass);
        config.setDriverClassName("org.postgresql.Driver");

        return new HikariDataSource(config);
    }
}
