package com.xdolce.inventory.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_movements")
@Data
public class InventoryMovement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id")
    @JsonIgnoreProperties({"inventoryMovements", "category"})
    private Product product;

    @Column(name = "movement_type", nullable = false)
    private String movementType; // 'IN', 'OUT', 'CREATE_PRODUCT', 'EDIT_PRODUCT', 'DELETE_PRODUCT', 'LAYAWAY_*'

    @Column(nullable = false)
    private Integer quantity = 0;

    @Column(name = "movement_date", nullable = false)
    private LocalDateTime movementDate = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"passwordHash"})
    private User user;

    private String notes;

    // For IN movements
    private String provider;

    // For OUT movements
    @ManyToOne
    @JoinColumn(name = "customer_id")
    @JsonIgnoreProperties({"layaways"})
    private Customer customer;

    // External reference (e.g., receipt, invoice)
    private String reference;
}

