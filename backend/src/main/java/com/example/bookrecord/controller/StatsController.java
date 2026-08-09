package com.example.bookrecord.controller;

import com.example.bookrecord.dto.StatsResponse;
import com.example.bookrecord.security.SecurityUtils;
import com.example.bookrecord.service.StatsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping
    public StatsResponse get(@RequestParam(required = false) Integer year) {
        return statsService.aggregate(year, SecurityUtils.getCurrentUserId());
    }
}
