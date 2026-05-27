package com.xdolce.inventory.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "layaways")
@Data
public class Layaway {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    @JsonIgnoreProperties({"layaways"})
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "product_id")
    @JsonIgnoreProperties({"description", "category", "imageUrl"})
    private Product product;

    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "paid_amount", nullable = false)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(nullable = false)
    private String status = "ACTIVE"; // 'ACTIVE', 'READY', 'CANCELLED'

    private String notes;
}
