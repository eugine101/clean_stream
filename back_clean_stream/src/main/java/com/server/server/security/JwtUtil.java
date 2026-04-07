package com.server.server.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.*;
 
@Slf4j
@Component
public class JwtUtil {
 
    @Value("${app.jwt.secret}")
    private String secret;
 
    @Value("${app.jwt.expiration-ms:86400000}") // 24h default
    private long expirationMs;
 
    private Key key() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
 
    public String generate(String userId, String tenantId, Set<String> permissions) {
        return Jwts.builder()
            .setSubject(userId)
            .claim("tenantId", tenantId)
            .claim("permissions", permissions)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
            .signWith(key(), SignatureAlgorithm.HS256)
            .compact();
    }

    /** Generate token with platform admin flag */
    public String generate(String userId, String tenantId, Set<String> permissions, boolean isPlatformAdmin) {
        return Jwts.builder()
            .setSubject(userId)
            .claim("tenantId", tenantId)
            .claim("permissions", permissions)
            .claim("isPlatformAdmin", isPlatformAdmin)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
            .signWith(key(), SignatureAlgorithm.HS256)
            .compact();
    }
 
    public Claims parse(String token) {
        return Jwts.parser()
            .verifyWith((javax.crypto.SecretKey) key())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
 
    public boolean isValid(String token) {
        try { 
            parse(token); 
            return true; 
        } catch (JwtException | IllegalArgumentException e) { 
            return false; 
        }
    }
    
    /**
     * Validate JWT token
     */
    public boolean validateToken(String token) {
        return isValid(token);
    }
    
    /**
     * Extract tenant ID from JWT token
     */
    public String getTenantIdFromToken(String token) {
        try {
            Claims claims = parse(token);
            Object tenantId = claims.get("tenantId");
            if (tenantId != null) {
                return tenantId.toString();
            }
            return claims.getSubject();
        } catch (JwtException e) {
            log.error("Error extracting tenant from JWT: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Extract user ID from JWT token
     */
    public String getUserIdFromToken(String token) {
        try {
            Claims claims = parse(token);
            Object userId = claims.get("userId");
            if (userId != null) {
                return userId.toString();
            }
            return claims.getSubject();
        } catch (JwtException e) {
            log.error("Error extracting user ID from JWT: {}", e.getMessage());
            return null;
        }
    }
}