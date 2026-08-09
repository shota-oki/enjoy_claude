package com.example.bookrecord.service;

import com.example.bookrecord.dto.LoginRequest;
import com.example.bookrecord.dto.LoginResponse;
import com.example.bookrecord.dto.RegisterRequest;
import com.example.bookrecord.dto.UserResponse;
import com.example.bookrecord.entity.User;
import com.example.bookrecord.exception.EmailAlreadyExistsException;
import com.example.bookrecord.exception.InvalidCredentialsException;
import com.example.bookrecord.repository.UserRepository;
import com.example.bookrecord.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException("このメールアドレスは既に登録されています");
        }
        User user =
                User.builder()
                        .email(request.email())
                        .passwordHash(passwordEncoder.encode(request.password()))
                        .build();
        User saved = userRepository.save(user);
        return new UserResponse(saved.getId(), saved.getEmail());
    }

    public LoginResponse login(LoginRequest request) {
        User user =
                userRepository
                        .findByEmail(request.email())
                        .orElseThrow(
                                () -> new InvalidCredentialsException("メールアドレスまたはパスワードが正しくありません"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("メールアドレスまたはパスワードが正しくありません");
        }
        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail());
        return new LoginResponse(token, new UserResponse(user.getId(), user.getEmail()));
    }
}
