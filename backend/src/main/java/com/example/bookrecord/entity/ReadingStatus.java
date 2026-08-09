package com.example.bookrecord.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ReadingStatus {
    UNREAD("未読"),
    READING("読書中"),
    FINISHED("読了");

    private final String label;

    ReadingStatus(String label) {
        this.label = label;
    }

    @JsonValue
    public String getLabel() {
        return label;
    }

    @JsonCreator
    public static ReadingStatus fromLabel(String label) {
        for (ReadingStatus status : values()) {
            if (status.label.equals(label)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown reading status: " + label);
    }
}
