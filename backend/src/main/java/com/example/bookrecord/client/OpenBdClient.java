package com.example.bookrecord.client;

import com.example.bookrecord.dto.BookSummary;
import com.example.bookrecord.exception.ExternalApiException;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** ISBN指定での書誌情報取得（openBD、無償・APIキー不要）。 */
@Component
public class OpenBdClient {

    private final RestClient restClient;

    public OpenBdClient(@Value("${app.openbd.base-url}") String baseUrl) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    public Optional<BookSummary> findByIsbn(String isbn) {
        OpenBdRecord[] records;
        try {
            records =
                    restClient
                            .get()
                            .uri(uriBuilder -> uriBuilder.path("/get").queryParam("isbn", isbn).build())
                            .retrieve()
                            .body(OpenBdRecord[].class);
        } catch (RestClientException ex) {
            throw new ExternalApiException("openBD APIとの通信に失敗しました", ex);
        }
        if (records == null || records.length == 0 || records[0] == null || records[0].summary() == null) {
            return Optional.empty();
        }
        return Optional.of(toBookSummary(records[0].summary()));
    }

    private static BookSummary toBookSummary(OpenBdSummary summary) {
        return new BookSummary(
                summary.isbn(), summary.title(), summary.author(), summary.publisher(), summary.cover());
    }

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    private record OpenBdRecord(OpenBdSummary summary) {}

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    private record OpenBdSummary(String isbn, String title, String author, String publisher, String cover) {}
}
