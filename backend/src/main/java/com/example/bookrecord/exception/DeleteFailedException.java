package com.example.bookrecord.exception;

public class DeleteFailedException extends RuntimeException {
    public DeleteFailedException(String message, Throwable cause) {
        super(message, cause);
    }
}
