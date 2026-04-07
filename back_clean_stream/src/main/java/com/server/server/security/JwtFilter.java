package com.server.server.security;

import com.server.server.repository.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;
 
@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {
 
    private final JwtUtil jwtUtil;
 
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        try {
            String header = req.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                String token = header.substring(7);
                if (jwtUtil.isValid(token)) {
                    Claims claims = jwtUtil.parse(token);
                    String userId = claims.getSubject();
                    String tenantId = claims.get("tenantId", String.class);
     
                    @SuppressWarnings("unchecked")
                    List<String> perms = (List<String>) claims.get("permissions", List.class);
                    
                    Boolean isPlatformAdmin = claims.get("isPlatformAdmin", Boolean.class);
                    if (isPlatformAdmin == null) isPlatformAdmin = false;
     
                    List<SimpleGrantedAuthority> authorities = perms == null ? List.of() :
                        perms.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList());
     
                    // Store details in authentication for downstream use
                    var detailsMap = new HashMap<String, Object>();
                    detailsMap.put("userId", userId);
                    detailsMap.put("tenantId", tenantId);
                    detailsMap.put("isPlatformAdmin", isPlatformAdmin);
                    
                    // Store userId|tenantId as principal for downstream use
                    var auth = new UsernamePasswordAuthenticationToken(
                        userId + "|" + tenantId, null, authorities);
                    auth.setDetails(detailsMap);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        } catch (Exception e) {
            // Log error but continue - let SecurityConfig handle unauthorized access
            SecurityContextHolder.clearContext();
        }
        chain.doFilter(req, res);
    }
}