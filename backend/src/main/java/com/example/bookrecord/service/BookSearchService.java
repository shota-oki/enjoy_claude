package com.example.bookrecord.service;

import com.example.bookrecord.client.NdlSearchClient;
import com.example.bookrecord.client.OpenBdClient;
import com.example.bookrecord.dto.BookSummary;
import com.example.bookrecord.exception.NoSearchResultsException;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

@Service
public class BookSearchService {

    private static final Pattern ISBN_PATTERN = Pattern.compile("\\d{10}|\\d{13}");
    private static final int TITLE_SEARCH_MAX_RESULTS = 20;

    private final OpenBdClient openBdClient;
    private final NdlSearchClient ndlSearchClient;

    public BookSearchService(OpenBdClient openBdClient, NdlSearchClient ndlSearchClient) {
        this.openBdClient = openBdClient;
        this.ndlSearchClient = ndlSearchClient;
    }

    public List<BookSummary> search(String q) {
        String normalized = q.replace("-", "").trim();
        List<BookSummary> results;
        if (ISBN_PATTERN.matcher(normalized).matches()) {
            results = openBdClient.findByIsbn(normalized).map(List::of).orElse(List.of());
        } else {
            results = ndlSearchClient.searchByTitle(q.trim(), TITLE_SEARCH_MAX_RESULTS);
        }
        if (results.isEmpty()) {
            throw new NoSearchResultsException("該当する書籍が見つかりませんでした");
        }
        return results;
    }
}
