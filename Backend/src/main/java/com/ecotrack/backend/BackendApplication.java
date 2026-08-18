package com.ecotrack.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.nio.file.Files;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		loadDotEnv();
		SpringApplication.run(BackendApplication.class, args);
	}

	private static void loadDotEnv() {
		try {
			File envFile = new File(".env");
			if (!envFile.exists()) {
				envFile = new File("Backend/.env");
			}
			if (envFile.exists()) {
				Files.readAllLines(envFile.toPath()).forEach(line -> {
					line = line.trim();
					if (!line.isEmpty() && !line.startsWith("#") && line.contains("=")) {
						String[] parts = line.split("=", 2);
						String key = parts[0].trim();
						String val = parts[1].trim().replaceAll("^\"|\"$", "");
						System.setProperty(key, val);
					}
				});
			}
		} catch (Exception e) {
			System.err.println("Could not pre-load .env file: " + e.getMessage());
		}
	}
}
