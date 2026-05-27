package com.xdolce.inventory.repository;

import com.xdolce.inventory.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
}
