package com.example.bookrecord.repository;

import com.example.bookrecord.entity.BookRecord;
import com.example.bookrecord.entity.ReadingStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface BookRecordRepository
        extends JpaRepository<BookRecord, Long>, JpaSpecificationExecutor<BookRecord> {

    Optional<BookRecord> findByIdAndUserId(Long id, Long userId);

    List<BookRecord> findByUserIdAndStatusAndFinishedDateBetween(
            Long userId, ReadingStatus status, LocalDate start, LocalDate end);
}
