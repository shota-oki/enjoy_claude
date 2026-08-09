package com.example.bookrecord.dto;

import java.util.List;

public record BookSearchResponse(List<BookSummary> results) {}
