package com.ecotrack.backend.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

public class DatabaseEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String databaseUrl = environment.getProperty("DATABASE_URL");
        if (databaseUrl != null && !databaseUrl.trim().isEmpty()) {
            String trimmedUrl = databaseUrl.trim();
            if (trimmedUrl.startsWith("postgres://") || trimmedUrl.startsWith("postgresql://")) {
                try {
                    String httpUrl = trimmedUrl.replace("postgres://", "http://").replace("postgresql://", "http://");
                    URI uri = new URI(httpUrl);
                    String host = uri.getHost();
                    int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                    String path = uri.getPath();

                    String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;

                    Map<String, Object> map = new HashMap<>();
                    map.put("spring.datasource.url", jdbcUrl);

                    if (uri.getUserInfo() != null) {
                        String[] userInfo = uri.getUserInfo().split(":");
                        if (userInfo.length > 0) {
                            map.put("spring.datasource.username", userInfo[0]);
                        }
                        if (userInfo.length > 1) {
                            map.put("spring.datasource.password", userInfo[1]);
                        }
                    }

                    environment.getPropertySources().addFirst(new MapPropertySource("railwayDatabaseProperties", map));
                } catch (Exception ignored) {
                }
            } else if (trimmedUrl.startsWith("jdbc:")) {
                Map<String, Object> map = new HashMap<>();
                map.put("spring.datasource.url", trimmedUrl);
                environment.getPropertySources().addFirst(new MapPropertySource("railwayDatabaseProperties", map));
            }
        }
    }
}
