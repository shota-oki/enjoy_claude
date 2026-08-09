package com.example.bookrecord.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import lombok.*;

@Entity
@Table(name = "book_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    private String isbn;

    @Column(nullable = false)
    private String title;

    private String author;

    private String publisher;

    @Column(name = "cover_image_url")
    private String coverImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReadingStatus status;

    @Column(name = "finished_date")
    private LocalDate finishedDate;

    @Column(length = 1000)
    private String review;

    private Integer rating;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "book_record_genres",
            joinColumns = @JoinColumn(name = "book_record_id"),
            inverseJoinColumns = @JoinColumn(name = "genre_id"))
    @Builder.Default
    private Set<Genre> genres = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
