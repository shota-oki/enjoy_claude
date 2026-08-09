package com.example.bookrecord.dto;

import com.example.bookrecord.entity.ReadingStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public record UpdateRecordRequest(
        @NotNull ReadingStatus status,
        LocalDate finishedDate,
        @Size(max = 1000, message = "感想は1000文字以内で入力してください") String review,
        @Min(1) @Max(5) Integer rating,
        List<String> genres) {}
