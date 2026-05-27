package com.xdolce.inventory.repository;

import com.xdolce.inventory.model.Layaway;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LayawayRepository extends JpaRepository<Layaway, Long> {
    List<Layaway> findByProductId(Long productId);
}
