package com.example.bookrecord.dto;

import com.example.bookrecord.entity.ReadingStatus;

public record RecordSummaryResponse(
        Long id,
        String isbn,
        String title,
        String author,
        String coverImageUrl,
        ReadingStatus status,
        Integer rating) {}
