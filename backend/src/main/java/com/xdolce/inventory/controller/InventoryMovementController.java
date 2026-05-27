package com.xdolce.inventory.controller;

import com.xdolce.inventory.model.InventoryMovement;
import com.xdolce.inventory.model.Product;
import com.xdolce.inventory.repository.InventoryMovementRepository;
import com.xdolce.inventory.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/movements")
public class InventoryMovementController {

    @Autowired
    private InventoryMovementRepository movementRepository;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public List<InventoryMovement> getAllMovements() {
        return movementRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> createMovement(@RequestBody InventoryMovement movement) {
        Optional<Product> productOpt = productRepository.findById(movement.getProduct().getId());
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            if ("IN".equalsIgnoreCase(movement.getMovementType())) {
                product.setStockLevel(product.getStockLevel() + movement.getQuantity());
            } else if ("OUT".equalsIgnoreCase(movement.getMovementType())) {
                if (product.getStockLevel() < movement.getQuantity()) {
                    return ResponseEntity.badRequest().body("Not enough stock");
                }
                product.setStockLevel(product.getStockLevel() - movement.getQuantity());
            }
            productRepository.save(product);
            movement.setMovementDate(LocalDateTime.now());
            return ResponseEntity.ok(movementRepository.save(movement));
        }
        return ResponseEntity.notFound().build();
    }
}
