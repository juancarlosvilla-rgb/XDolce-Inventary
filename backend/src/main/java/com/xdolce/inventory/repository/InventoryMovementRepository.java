package com.xdolce.inventory.repository;

import com.xdolce.inventory.model.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {
    List<InventoryMovement> findByProductId(Long productId);
}
