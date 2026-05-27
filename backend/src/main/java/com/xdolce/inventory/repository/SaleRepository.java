package com.xdolce.inventory.repository;

import com.xdolce.inventory.model.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SaleRepository extends JpaRepository<Sale, Long> {
    List<Sale> findAllByOrderBySaleDateDesc();
}
