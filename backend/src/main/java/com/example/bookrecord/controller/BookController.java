package com.example.bookrecord.controller;

import com.example.bookrecord.dto.BookSearchResponse;
import com.example.bookrecord.exception.ValidationException;
import com.example.bookrecord.service.BookSearchService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/books")
public class BookController {

    private final BookSearchService bookSearchService;

    public BookController(BookSearchService bookSearchService) {
        this.bookSearchService = bookSearchService;
    }

    @GetMapping("/search")
    public BookSearchResponse search(@RequestParam String q) {
        if (q == null || q.isBlank()) {
            throw new ValidationException("検索キーワードを入力してください");
        }
        return new BookSearchResponse(bookSearchService.search(q));
    }
}
