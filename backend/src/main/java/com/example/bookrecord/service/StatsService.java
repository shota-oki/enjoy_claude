package com.example.bookrecord.service;

import com.example.bookrecord.dto.GenreCount;
import com.example.bookrecord.dto.StatsResponse;
import com.example.bookrecord.entity.BookRecord;
import com.example.bookrecord.entity.Genre;
import com.example.bookrecord.entity.ReadingStatus;
import com.example.bookrecord.repository.BookRecordRepository;
import java.time.LocalDate;
import java.time.Year;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StatsService {

    private final BookRecordRepository bookRecordRepository;

    public StatsService(BookRecordRepository bookRecordRepository) {
        this.bookRecordRepository = bookRecordRepository;
    }

    @Transactional(readOnly = true)
    public StatsResponse aggregate(Integer year, Long userId) {
        int targetYear = year != null ? year : Year.now().getValue();
        LocalDate start = LocalDate.of(targetYear, 1, 1);
        LocalDate end = LocalDate.of(targetYear, 12, 31);

        List<BookRecord> finishedRecords =
                bookRecordRepository.findByUserIdAndStatusAndFinishedDateBetween(
                        userId, ReadingStatus.FINISHED, start, end);

        Map<String, Long> genreCounts = new LinkedHashMap<>();
        for (BookRecord record : finishedRecords) {
            for (Genre genre : record.getGenres()) {
                genreCounts.merge(genre.getName(), 1L, Long::sum);
            }
        }

        List<GenreCount> breakdown =
                genreCounts.entrySet().stream()
                        .map(e -> new GenreCount(e.getKey(), e.getValue()))
                        .sorted(Comparator.comparing(GenreCount::count).reversed())
                        .toList();

        return new StatsResponse(targetYear, finishedRecords.size(), breakdown);
    }
}
