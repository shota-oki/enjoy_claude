package com.example.bookrecord.dto;

import java.util.List;

public record RecordListResponse(
        List<RecordSummaryResponse> items, int page, int size, long totalCount) {}
