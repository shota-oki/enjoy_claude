package com.example.bookrecord.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank
                @Size(min = 8, message = "パスワードは8文字以上で入力してください")
                @Pattern(
                        regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
                        message = "パスワードは英字と数字を含めてください")
                String password) {}
