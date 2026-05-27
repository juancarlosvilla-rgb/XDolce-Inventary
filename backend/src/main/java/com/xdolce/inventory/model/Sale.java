package com.xdolce.inventory.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "sales")
@Data
public class Sale {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "tax_amount")
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "sale_date", nullable = false)
    private LocalDateTime saleDate = LocalDateTime.now();

    @Column(name = "payment_method")
    private String paymentMethod = "EFECTIVO"; // EFECTIVO, NEQUI, DAVIPLATA, TRANSFERENCIA, TARJETA

    @Column
    private String notes;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"passwordHash"})
    private User user;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    @JsonIgnoreProperties({"layaways"})
    private Customer customer;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"sale"})
    private List<SaleItem> items;
}
