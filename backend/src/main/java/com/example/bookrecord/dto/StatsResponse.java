package com.example.bookrecord.dto;

import java.util.List;

public record StatsResponse(int year, long totalCount, List<GenreCount> genreBreakdown) {}
