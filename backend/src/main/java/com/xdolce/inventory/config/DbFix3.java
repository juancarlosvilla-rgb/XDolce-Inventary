package com.xdolce.inventory.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DbFix3 implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            jdbcTemplate.execute("UPDATE users SET role = 'ADMIN'");
            System.out.println("FIX: Updated all existing users to ADMIN to prevent lockout.");
        } catch (Exception e) {
            System.out.println("FIX: Could not update users to ADMIN: " + e.getMessage());
        }
    }
}
