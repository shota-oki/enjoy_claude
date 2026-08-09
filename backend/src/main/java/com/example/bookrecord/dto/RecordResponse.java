package com.example.bookrecord.dto;

import com.example.bookrecord.entity.ReadingStatus;
import java.time.LocalDate;
import java.util.List;

public record RecordResponse(
        Long id,
        String isbn,
        String title,
        String author,
        String publisher,
        String coverImageUrl,
        ReadingStatus status,
        LocalDate finishedDate,
        String review,
        Integer rating,
        List<String> genres) {}
