package com.example.bookrecord.service;

import com.example.bookrecord.entity.Genre;
import com.example.bookrecord.repository.GenreRepository;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GenreService {

    private final GenreRepository genreRepository;

    public GenreService(GenreRepository genreRepository) {
        this.genreRepository = genreRepository;
    }

    @Transactional
    public Set<Genre> findOrCreate(List<String> names) {
        Set<Genre> genres = new LinkedHashSet<>();
        if (names == null) {
            return genres;
        }
        for (String name : names) {
            if (name == null || name.isBlank()) {
                continue;
            }
            Genre genre =
                    genreRepository
                            .findByName(name)
                            .orElseGet(() -> genreRepository.save(Genre.builder().name(name).build()));
            genres.add(genre);
        }
        return genres;
    }
}
