package com.ecotrack.backend.controller;

import com.ecotrack.backend.dto.ApiResponse;
import com.ecotrack.backend.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReportSummary(
            @RequestParam(defaultValue = "carbon") String reportType,
            @RequestParam(defaultValue = "last-30") String dateRange,
            Authentication authentication) {
        
        String userEmail = (authentication != null) ? authentication.getName() : "demo@ecotrack.com";
        Map<String, Object> data = reportService.generateReportData(userEmail, reportType, dateRange);
        return ResponseEntity.ok(new ApiResponse<>(true, "Report summary generated successfully", data));
    }

    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadReport(
            @RequestParam(defaultValue = "carbon") String reportType,
            @RequestParam(defaultValue = "last-30") String dateRange,
            @RequestParam(defaultValue = "pdf") String format,
            Authentication authentication) {

        String userEmail = (authentication != null) ? authentication.getName() : "demo@ecotrack.com";
        byte[] fileBytes = reportService.generateReportExport(userEmail, reportType, dateRange, format);

        boolean isExcel = ("excel".equalsIgnoreCase(format) || "csv".equalsIgnoreCase(format));
        String ext = isExcel ? "csv" : "pdf";
        String mime = isExcel ? "text/csv;charset=UTF-8" : "application/pdf";
        String fileName = String.format("EcoTrack_%s_Report_%s.%s", reportType, dateRange, ext);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType(mime))
                .body(fileBytes);
    }
}
