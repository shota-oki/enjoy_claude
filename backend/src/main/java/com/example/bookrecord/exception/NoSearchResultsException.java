package com.example.bookrecord.exception;

public class NoSearchResultsException extends RuntimeException {
    public NoSearchResultsException(String message) {
        super(message);
    }
}
