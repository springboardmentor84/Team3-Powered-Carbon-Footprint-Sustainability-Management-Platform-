package com.ecotrack.backend.service;

import java.util.Map;

public interface ReportService {
    Map<String, Object> generateReportData(String userEmail, String reportType, String dateRange);
    byte[] generateReportExport(String userEmail, String reportType, String dateRange, String format);
}
