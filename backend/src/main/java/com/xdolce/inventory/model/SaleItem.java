package com.xdolce.inventory.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "sale_items")
@Data
public class SaleItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "sale_id")
    @JsonIgnoreProperties({"items", "customer", "user"})
    private Sale sale;

    @ManyToOne
    @JoinColumn(name = "product_id")
    @JsonIgnoreProperties({"category", "description", "imageUrl"})
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "subtotal")
    private BigDecimal subtotal;
}
