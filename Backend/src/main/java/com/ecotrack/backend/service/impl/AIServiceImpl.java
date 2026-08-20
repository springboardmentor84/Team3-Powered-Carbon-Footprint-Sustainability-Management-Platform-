package com.ecotrack.backend.service.impl;

import com.ecotrack.backend.dto.RecommendationResponse;
import com.ecotrack.backend.entity.CarbonEmission;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.exception.ResourceNotFoundException;
import com.ecotrack.backend.repository.CarbonEmissionRepository;
import com.ecotrack.backend.repository.UserRepository;
import com.ecotrack.backend.service.AIService;
import com.ecotrack.backend.utils.PromptBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AIServiceImpl implements AIService {

    private static final String OPENAI_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
    private static final String OPENAI_MODEL = "google/gemma-4-26b-a4b-it:free";

    private final CarbonEmissionRepository carbonEmissionRepository;
    private final UserRepository userRepository;
    private final PromptBuilder promptBuilder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${openai.api.key}")
    private String openAiApiKey;

    @Override
    @Transactional(readOnly = true)
    public RecommendationResponse recommend(String authenticatedEmail) {
        User user = userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<CarbonEmission> emissions = carbonEmissionRepository.findByUserId(user.getId());
        String prompt = promptBuilder.buildPrompt(user, emissions);

        String responseBody = callOpenAi(prompt);
        List<String> recommendations = parseRecommendations(responseBody);

        return RecommendationResponse.builder()
                .recommendations(recommendations)
                .build();
    }

    private static final List<String> FREE_MODELS = List.of(
            "google/gemma-4-26b-a4b-it:free",
            "nvidia/nemotron-3-nano-30b-a3b:free",
            "nvidia/nemotron-nano-9b-v2:free",
            "poolside/laguna-s-2.1:free"
    );

    @Override
    public String analyzePrompt(String prompt, String context, String authenticatedEmail) {
        if (prompt == null || prompt.isBlank()) {
            return "Please ask a question about carbon reduction or sustainability.";
        }

        if (openAiApiKey == null || openAiApiKey.isBlank()) {
            return null;
        }

        // Build system message — inject live score context if provided
        String scoreSection = (context != null && !context.isBlank())
                ? "\n\nUSER'S LIVE DASHBOARD DATA (use these exact numbers when answering personal score or category questions):\n" + context + "\n"
                : "";

        String systemMessage =
                "You are Eco-AI, an expert sustainability and climate science assistant for the EcoTrack platform." + scoreSection + "\n" +
                "STRICT GUIDELINES:\n" +
                "1. GENERAL SCIENCE QUESTIONS: If the user asks a general/scientific question (e.g., 'what is carbon', 'what is carbon emission', 'what is global warming', 'what causes climate change'), answer it directly, accurately, and comprehensively. Do NOT reference the user's personal scores for these questions.\n" +
                "2. PERSONAL SCORE QUESTIONS: If the user asks about their score in any category (e.g., 'what is my electricity score', 'what is my score in Planting', 'how did I do in Water'), you MUST look up the exact number from the USER'S LIVE DASHBOARD DATA above and state it precisely (e.g., 'Your Tree Plantation score is 85/100'). Never invent or guess scores.\n" +
                "3. LIST ALL SCORES: If the user asks to list their scores or asks about all categories, list EVERY category with its exact score from the USER'S LIVE DASHBOARD DATA above, formatted clearly. Include the overall score.\n" +
                "4. SCORE CALCULATION: If the user asks how their score was calculated, explain that EcoTrack tracks 12 categories using standard emission factors (e.g., 0.39 kg CO2/kWh for electricity, 2.31 kg CO2/L for petrol) and converts emissions to a 0-100 scale per category. The overall score is the average of all 12 category scores.\n" +
                "5. IMPROVEMENT TIPS: If the user asks how to improve a specific category, reference their actual score for that category from the dashboard data and give targeted advice.\n" +
                "6. TYPOS: Understand user intent with typos (e.g., 'corban' = 'carbon', 'emmision' = 'emission', 'Planting' = 'Tree Plantation'). Never mention the typo.\n" +
                "7. FORMAT: Responses must be structured, concise, and completely free of emojis.";

        for (String model : FREE_MODELS) {
            try {
                OpenAiChatRequest requestPayload = new OpenAiChatRequest(
                        model,
                        List.of(
                                new ChatMessage("system", systemMessage),
                                new ChatMessage("user", prompt)
                        ),
                        null
                );

                String requestJson = buildRequestJson(requestPayload);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(OPENAI_ENDPOINT))
                        .timeout(Duration.ofSeconds(15))
                        .header("Authorization", "Bearer " + openAiApiKey)
                        .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                        .header("HTTP-Referer", "http://localhost:4200")
                        .header("X-Title", "EcoTrack")
                        .POST(HttpRequest.BodyPublishers.ofString(requestJson, StandardCharsets.UTF_8))
                        .build();

                HttpResponse<String> response = HttpClient.newHttpClient()
                        .send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    String content = extractAssistantContent(response.body());
                    if (content != null && !content.isBlank()) {
                        System.out.println("[AI] Model " + model + " responded successfully.");
                        return content;
                    }
                } else {
                    System.err.println("[AI] Model " + model + " returned HTTP " + response.statusCode() + ": " + response.body());
                }
            } catch (Exception e) {
                System.err.println("[AI] Model " + model + " exception: " + e.getMessage());
            }
        }
        return null;
    }

    private String callOpenAi(String prompt) {
        if (openAiApiKey == null || openAiApiKey.isBlank()) {
            throw new IllegalStateException("OpenAI API key is not configured");
        }

        OpenAiChatRequest requestPayload = new OpenAiChatRequest(
                OPENAI_MODEL,
                List.of(
                        new ChatMessage("system", "You are a sustainability assistant that returns only valid JSON."),
                        new ChatMessage("user", prompt)
                ),
                new ResponseFormat("json_object")
        );

        try {
            String requestJson = buildRequestJson(requestPayload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(OPENAI_ENDPOINT))
                    .timeout(Duration.ofSeconds(30))
                    .header("Authorization", "Bearer " + openAiApiKey)
                    .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                    .header("HTTP-Referer", "http://localhost:4200")
                    .header("X-Title", "EcoTrack")
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("OpenAI request failed with status code: " + response.statusCode());
            }

            String content = extractAssistantContent(response.body());
            if (content == null || content.isBlank()) {
                throw new IllegalStateException("OpenAI returned an empty recommendation payload");
            }

            return content;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Failed to generate AI recommendations", ex);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to generate AI recommendations", ex);
        }
    }

    private List<String> parseRecommendations(String responseBody) {
        Pattern arrayPattern = Pattern.compile("\\\"recommendations\\\"\\s*:\\s*\\[(.*?)\\]", Pattern.DOTALL);
        Matcher arrayMatcher = arrayPattern.matcher(responseBody);

        if (!arrayMatcher.find()) {
            throw new IllegalStateException("Unable to parse AI recommendations");
        }

        String arrayContent = arrayMatcher.group(1);
        Pattern itemPattern = Pattern.compile("\\\"((?:\\\\.|[^\\\"])*)\\\"");
        Matcher itemMatcher = itemPattern.matcher(arrayContent);

        List<String> recommendations = new java.util.ArrayList<>();
        while (itemMatcher.find()) {
            recommendations.add(unescapeJsonString(itemMatcher.group(1)));
        }

        if (recommendations.isEmpty()) {
            throw new IllegalStateException("OpenAI returned no recommendations");
        }

        return recommendations.stream().limit(5).toList();
    }

    private String buildRequestJson(OpenAiChatRequest requestPayload) {
        StringBuilder builder = new StringBuilder();
        builder.append('{');
        builder.append("\"model\":\"").append(escapeJson(requestPayload.model())).append("\",");
        builder.append("\"messages\":[");
        for (int index = 0; index < requestPayload.messages().size(); index++) {
            ChatMessage message = requestPayload.messages().get(index);
            builder.append('{')
                    .append("\"role\":\"").append(escapeJson(message.role())).append("\",")
                    .append("\"content\":\"").append(escapeJson(message.content())).append("\"")
                    .append('}');
            if (index < requestPayload.messages().size() - 1) {
                builder.append(',');
            }
        }
        builder.append("]");
        if (requestPayload.responseFormat() != null) {
            builder.append(",\"response_format\":{\"type\":\"")
                    .append(escapeJson(requestPayload.responseFormat().type()))
                    .append("\"}");
        }
        builder.append('}');
        return builder.toString();
    }

    private String extractAssistantContent(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode choices = root.path("choices");
            if (choices.isArray() && !choices.isEmpty()) {
                String content = choices.get(0).path("message").path("content").asText();
                if (content != null && !content.isBlank()) {
                    return content;
                }
            }
        } catch (Exception e) {
            System.err.println("Error parsing OpenRouter response: " + e.getMessage());
        }

        Pattern contentPattern = Pattern.compile("\\\"content\\\"\\s*:\\s*\\\"((?:\\\\.|[^\\\"])*)\\\"", Pattern.DOTALL);
        Matcher contentMatcher = contentPattern.matcher(responseBody);

        if (!contentMatcher.find()) {
            throw new IllegalStateException("OpenAI/OpenRouter returned no response content");
        }

        return unescapeJsonString(contentMatcher.group(1));
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }

        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private String unescapeJsonString(String value) {
        StringBuilder builder = new StringBuilder();
        boolean escaping = false;

        for (int index = 0; index < value.length(); index++) {
            char current = value.charAt(index);

            if (escaping) {
                switch (current) {
                    case '"' -> builder.append('"');
                    case '\\' -> builder.append('\\');
                    case '/' -> builder.append('/');
                    case 'b' -> builder.append('\b');
                    case 'f' -> builder.append('\f');
                    case 'n' -> builder.append('\n');
                    case 'r' -> builder.append('\r');
                    case 't' -> builder.append('\t');
                    default -> builder.append(current);
                }
                escaping = false;
                continue;
            }

            if (current == '\\') {
                escaping = true;
                continue;
            }

            builder.append(current);
        }

        return builder.toString();
    }

    private record OpenAiChatRequest(String model, List<ChatMessage> messages, ResponseFormat responseFormat) {
    }

    private record ChatMessage(String role, String content) {
    }

    private record ResponseFormat(String type) {
    }
}
