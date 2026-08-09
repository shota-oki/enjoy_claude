package com.example.bookrecord.controller;

import com.example.bookrecord.dto.CreateRecordRequest;
import com.example.bookrecord.dto.RecordListResponse;
import com.example.bookrecord.dto.RecordResponse;
import com.example.bookrecord.dto.UpdateRecordRequest;
import com.example.bookrecord.security.SecurityUtils;
import com.example.bookrecord.service.RecordService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/records")
public class RecordController {

    private final RecordService recordService;

    public RecordController(RecordService recordService) {
        this.recordService = recordService;
    }

    @GetMapping
    public RecordListResponse list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<String> genre,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return recordService.search(
                keyword, genre, status, page, size, SecurityUtils.getCurrentUserId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RecordResponse create(@Valid @RequestBody CreateRecordRequest request) {
        return recordService.create(request, SecurityUtils.getCurrentUserId());
    }

    @GetMapping("/{id}")
    public RecordResponse get(@PathVariable Long id) {
        return recordService.get(id, SecurityUtils.getCurrentUserId());
    }

    @PutMapping("/{id}")
    public RecordResponse update(
            @PathVariable Long id, @Valid @RequestBody UpdateRecordRequest request) {
        return recordService.update(id, request, SecurityUtils.getCurrentUserId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        recordService.delete(id, SecurityUtils.getCurrentUserId());
    }
}
