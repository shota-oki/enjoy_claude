package com.example.bookrecord.service;

import com.example.bookrecord.dto.CreateRecordRequest;
import com.example.bookrecord.dto.RecordListResponse;
import com.example.bookrecord.dto.RecordResponse;
import com.example.bookrecord.dto.RecordSummaryResponse;
import com.example.bookrecord.dto.UpdateRecordRequest;
import com.example.bookrecord.entity.BookRecord;
import com.example.bookrecord.entity.Genre;
import com.example.bookrecord.entity.ReadingStatus;
import com.example.bookrecord.exception.DeleteFailedException;
import com.example.bookrecord.exception.RecordNotFoundException;
import com.example.bookrecord.exception.ValidationException;
import com.example.bookrecord.repository.BookRecordRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecordService {

    private final BookRecordRepository bookRecordRepository;
    private final GenreService genreService;

    public RecordService(BookRecordRepository bookRecordRepository, GenreService genreService) {
        this.bookRecordRepository = bookRecordRepository;
        this.genreService = genreService;
    }

    @Transactional
    public RecordResponse create(CreateRecordRequest request, Long userId) {
        validateStatusAndFinishedDate(request.status(), request.finishedDate());
        Set<Genre> genres = genreService.findOrCreate(request.genres());

        BookRecord record =
                BookRecord.builder()
                        .userId(userId)
                        .isbn(request.isbn())
                        .title(request.title())
                        .author(request.author())
                        .publisher(request.publisher())
                        .coverImageUrl(request.coverImageUrl())
                        .status(request.status())
                        .finishedDate(request.finishedDate())
                        .review(request.review())
                        .rating(request.rating())
                        .genres(genres)
                        .build();

        return toResponse(bookRecordRepository.save(record));
    }

    @Transactional(readOnly = true)
    public RecordListResponse search(
            String keyword, List<String> genres, String statusLabel, int page, int size, Long userId) {
        if (page < 1 || size < 1) {
            throw new ValidationException("pageまたはsizeの指定が不正です");
        }
        ReadingStatus status = statusLabel == null || statusLabel.isBlank()
                ? null
                : ReadingStatus.fromLabel(statusLabel);

        Specification<BookRecord> spec =
                (root, query, cb) -> {
                    query.distinct(true);
                    List<Predicate> predicates = new ArrayList<>();
                    predicates.add(cb.equal(root.get("userId"), userId));
                    if (keyword != null && !keyword.isBlank()) {
                        String like = "%" + keyword + "%";
                        predicates.add(
                                cb.or(cb.like(root.get("title"), like), cb.like(root.get("author"), like)));
                    }
                    if (status != null) {
                        predicates.add(cb.equal(root.get("status"), status));
                    }
                    if (genres != null && !genres.isEmpty()) {
                        Join<BookRecord, Genre> genreJoin = root.join("genres");
                        predicates.add(genreJoin.get("name").in(genres));
                    }
                    return cb.and(predicates.toArray(new Predicate[0]));
                };

        Page<BookRecord> result =
                bookRecordRepository.findAll(spec, PageRequest.of(page - 1, size));

        List<RecordSummaryResponse> items =
                result.getContent().stream().map(RecordService::toSummary).collect(Collectors.toList());

        return new RecordListResponse(items, page, size, result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public RecordResponse get(Long id, Long userId) {
        return toResponse(findOwnedRecord(id, userId));
    }

    @Transactional
    public RecordResponse update(Long id, UpdateRecordRequest request, Long userId) {
        BookRecord record = findOwnedRecord(id, userId);
        validateStatusAndFinishedDate(request.status(), request.finishedDate());

        record.setStatus(request.status());
        record.setFinishedDate(request.finishedDate());
        record.setReview(request.review());
        record.setRating(request.rating());
        record.setGenres(genreService.findOrCreate(request.genres()));

        return toResponse(bookRecordRepository.save(record));
    }

    @Transactional
    public void delete(Long id, Long userId) {
        BookRecord record = findOwnedRecord(id, userId);
        try {
            bookRecordRepository.delete(record);
        } catch (Exception ex) {
            throw new DeleteFailedException("削除に失敗しました", ex);
        }
    }

    private BookRecord findOwnedRecord(Long id, Long userId) {
        return bookRecordRepository
                .findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RecordNotFoundException("指定された蔵書記録が見つかりません"));
    }

    private void validateStatusAndFinishedDate(ReadingStatus status, LocalDate finishedDate) {
        if (status == ReadingStatus.FINISHED && finishedDate == null) {
            throw new ValidationException("読了日を入力してください");
        }
        if (finishedDate != null && finishedDate.isAfter(LocalDate.now())) {
            throw new ValidationException("読了日には本日以前の日付を指定してください");
        }
    }

    private static RecordResponse toResponse(BookRecord record) {
        return new RecordResponse(
                record.getId(),
                record.getIsbn(),
                record.getTitle(),
                record.getAuthor(),
                record.getPublisher(),
                record.getCoverImageUrl(),
                record.getStatus(),
                record.getFinishedDate(),
                record.getReview(),
                record.getRating(),
                record.getGenres().stream().map(Genre::getName).collect(Collectors.toList()));
    }

    private static RecordSummaryResponse toSummary(BookRecord record) {
        return new RecordSummaryResponse(
                record.getId(),
                record.getIsbn(),
                record.getTitle(),
                record.getAuthor(),
                record.getCoverImageUrl(),
                record.getStatus(),
                record.getRating());
    }
}
