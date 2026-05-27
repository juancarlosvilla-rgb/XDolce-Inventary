package com.xdolce.inventory.repository;

import com.xdolce.inventory.model.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {
    List<SaleItem> findBySaleId(Long saleId);
    void deleteBySaleId(Long saleId);
    List<SaleItem> findByProductId(Long productId);
}
