package com.pulsecheck.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final RedisTemplate<String, String> redisTemplate;

    public void blacklistToken(String token) {
        try {
            redisTemplate.opsForValue().set("blacklist:" + token, "true", Duration.ofDays(7));
            log.info("Token blacklisted: {}", token);
        } catch (Exception e) {
            log.error("Error blacklisting token", e);
        }
    }

    public boolean isTokenBlacklisted(String token) {
        try {
            String isBlacklisted = redisTemplate.opsForValue().get("blacklist:" + token);
            return Boolean.TRUE.equals(isBlacklisted);
        } catch (Exception e) {
            log.error("Error checking token blacklist", e);
            return true; // Fail safe
        }
    }

    public void removeFromBlacklist(String token) {
        try {
            redisTemplate.delete("blacklist:" + token);
            log.info("Token removed from blacklist: {}", token);
        } catch (Exception e) {
            log.error("Error removing token from blacklist", e);
        }
    }
}
