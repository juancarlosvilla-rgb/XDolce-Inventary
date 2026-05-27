package com.xdolce.inventory.controller;

import com.xdolce.inventory.model.Product;
import com.xdolce.inventory.model.InventoryMovement;
import com.xdolce.inventory.model.User;
import com.xdolce.inventory.model.Layaway;
import com.xdolce.inventory.repository.ProductRepository;
import com.xdolce.inventory.repository.InventoryMovementRepository;
import com.xdolce.inventory.repository.UserRepository;
import com.xdolce.inventory.repository.LayawayRepository;
import com.xdolce.inventory.repository.SaleItemRepository;
import com.xdolce.inventory.model.SaleItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryMovementRepository movementRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LayawayRepository layawayRepository;

    @Autowired
    private SaleItemRepository saleItemRepository;

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @PostMapping
    public Product createProduct(@RequestBody Product product) {
        // Ensure stockLevel is not null
        if (product.getStockLevel() == null) product.setStockLevel(0);
        if (product.getStatus() == null) product.setStatus("ACTIVE");

        Product savedProduct = productRepository.save(product);

        // Log movement CREATE_PRODUCT
        InventoryMovement movement = new InventoryMovement();
        movement.setProduct(savedProduct);
        movement.setMovementType("CREATE_PRODUCT");
        movement.setQuantity(savedProduct.getStockLevel() != null ? savedProduct.getStockLevel() : 0);
        movement.setNotes("Registro inicial de producto: " + savedProduct.getName());
        movement.setMovementDate(LocalDateTime.now());

        // Use user 1 if exists, otherwise skip user assignment
        userRepository.findById(1L).ifPresent(movement::setUser);

        movementRepository.save(movement);

        return savedProduct;
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product productDetails) {
        return productRepository.findById(id).map(product -> {
            product.setName(productDetails.getName());
            product.setSku(productDetails.getSku());
            product.setDescription(productDetails.getDescription());
            product.setPrice(productDetails.getPrice());
            product.setStockLevel(productDetails.getStockLevel());
            product.setStatus(productDetails.getStatus() != null ? productDetails.getStatus() : product.getStatus());
            product.setCategory(productDetails.getCategory());
            product.setImageUrl(productDetails.getImageUrl());

            Product saved = productRepository.save(product);

            // Log EDIT_PRODUCT movement
            InventoryMovement movement = new InventoryMovement();
            movement.setProduct(saved);
            movement.setMovementType("EDIT_PRODUCT");
            movement.setQuantity(saved.getStockLevel());
            movement.setNotes("Producto editado: " + saved.getName());
            movement.setMovementDate(LocalDateTime.now());
            userRepository.findById(1L).ifPresent(movement::setUser);
            movementRepository.save(movement);

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        return productRepository.findById(id).map(product -> {
            // Nullify references in inventory movements to avoid FK constraints
            List<InventoryMovement> movements = movementRepository.findByProductId(id);
            for (InventoryMovement m : movements) {
                m.setProduct(null);
                movementRepository.save(m);
            }

            // Nullify references in layaways to avoid FK constraints
            List<Layaway> layaways = layawayRepository.findByProductId(id);
            for (Layaway l : layaways) {
                l.setProduct(null);
                layawayRepository.save(l);
            }

            // Nullify references in sale_items to avoid FK constraints
            List<SaleItem> saleItems = saleItemRepository.findByProductId(id);
            for (SaleItem item : saleItems) {
                item.setProduct(null);
                saleItemRepository.save(item);
            }

            // Log movement DELETE_PRODUCT
            InventoryMovement movement = new InventoryMovement();
            movement.setProduct(null);
            movement.setMovementType("DELETE_PRODUCT");
            movement.setQuantity(product.getStockLevel() != null ? product.getStockLevel() : 0);
            movement.setNotes("Producto eliminado: " + product.getName() + " (" + product.getSku() + ")");
            movement.setMovementDate(LocalDateTime.now());
            userRepository.findById(1L).ifPresent(movement::setUser);
            movementRepository.save(movement);

            productRepository.delete(product);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // Bulk delete endpoint
    @DeleteMapping("/bulk")
    @Transactional
    public ResponseEntity<?> deleteProductsBulk(@RequestBody List<Long> ids) {
        int deleted = 0;
        for (Long id : ids) {
            try {
                productRepository.findById(id).ifPresent(product -> {
                    // Nullify FK references in movements
                    List<InventoryMovement> movements = movementRepository.findByProductId(product.getId());
                    for (InventoryMovement m : movements) {
                        m.setProduct(null);
                        movementRepository.save(m);
                    }
                    // Nullify FK references in layaways
                    List<Layaway> layaways = layawayRepository.findByProductId(product.getId());
                    for (Layaway l : layaways) {
                        l.setProduct(null);
                        layawayRepository.save(l);
                    }
                    // Nullify FK references in sale_items
                    List<SaleItem> saleItems = saleItemRepository.findByProductId(product.getId());
                    for (SaleItem item : saleItems) {
                        item.setProduct(null);
                        saleItemRepository.save(item);
                    }
                    // Log deletion
                    InventoryMovement movement = new InventoryMovement();
                    movement.setMovementType("DELETE_PRODUCT");
                    movement.setQuantity(product.getStockLevel() != null ? product.getStockLevel() : 0);
                    movement.setNotes("Producto eliminado (lote): " + product.getName() + " (" + product.getSku() + ")");
                    movement.setMovementDate(LocalDateTime.now());
                    userRepository.findById(1L).ifPresent(movement::setUser);
                    movementRepository.save(movement);

                    productRepository.delete(product);
                });
                deleted++;
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return ResponseEntity.ok(java.util.Map.of("deleted", deleted, "total", ids.size()));
    }
}

