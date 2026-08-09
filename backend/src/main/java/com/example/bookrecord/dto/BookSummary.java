package com.example.bookrecord.dto;

public record BookSummary(
        String isbn, String title, String author, String publisher, String coverImageUrl) {}
