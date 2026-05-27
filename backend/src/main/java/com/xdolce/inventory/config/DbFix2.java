package com.xdolce.inventory.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DbFix2 implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            jdbcTemplate.execute("ALTER TABLE products ALTER COLUMN image_url TYPE TEXT");
            System.out.println("FIX: Changed image_url column to TEXT in products table.");
        } catch (Exception e) {
            System.out.println("FIX: Could not alter image_url column: " + e.getMessage());
        }
    }
}
