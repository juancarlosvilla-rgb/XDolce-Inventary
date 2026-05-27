package com.xdolce.inventory.controller;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.xdolce.inventory.model.*;
import com.xdolce.inventory.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/sales")
public class SaleController {

    @Autowired private SaleRepository saleRepository;
    @Autowired private SaleItemRepository saleItemRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private InventoryMovementRepository movementRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CustomerRepository customerRepository;

    // GET all sales (with items embedded via @OneToMany EAGER)
    @GetMapping
    public List<Sale> getAllSales() {
        return saleRepository.findAllByOrderBySaleDateDesc();
    }

    // GET single sale
    @GetMapping("/{id}")
    public ResponseEntity<Sale> getSaleById(@PathVariable Long id) {
        return saleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST - create a new sale
    @PostMapping
    @Transactional
    public ResponseEntity<?> createSale(@RequestBody SaleDTO request) {
        try {
            Sale sale = new Sale();
            sale.setSaleDate(LocalDateTime.now());
            sale.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "EFECTIVO");
            sale.setNotes(request.getNotes());

            // Attach user
            if (request.getUserId() != null) {
                userRepository.findById(request.getUserId()).ifPresent(sale::setUser);
            }

            // Attach customer
            if (request.getCustomerId() != null) {
                customerRepository.findById(request.getCustomerId()).ifPresent(sale::setCustomer);
            }

            // Calculate totals from items
            BigDecimal subtotal = BigDecimal.ZERO;
            for (SaleItemDTO itemDTO : request.getItems()) {
                Optional<Product> pOpt = productRepository.findById(itemDTO.getProductId());
                if (pOpt.isEmpty()) {
                    return ResponseEntity.badRequest().body("Producto no encontrado: ID " + itemDTO.getProductId());
                }
                Product p = pOpt.get();
                if (p.getStockLevel() < itemDTO.getQuantity()) {
                    return ResponseEntity.badRequest().body(
                        "Stock insuficiente para: " + p.getName() + ". Disponible: " + p.getStockLevel());
                }
                BigDecimal itemSubtotal = itemDTO.getUnitPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity()));
                subtotal = subtotal.add(itemSubtotal);
            }

            BigDecimal taxAmount = request.getTaxAmount() != null ? request.getTaxAmount() : BigDecimal.ZERO;
            sale.setTaxAmount(taxAmount);
            sale.setTotalAmount(subtotal.add(taxAmount));

            Sale savedSale = saleRepository.save(sale);

            // Save items + deduct stock + log movements
            for (SaleItemDTO itemDTO : request.getItems()) {
                Product p = productRepository.findById(itemDTO.getProductId()).get();

                SaleItem item = new SaleItem();
                item.setSale(savedSale);
                item.setProduct(p);
                item.setQuantity(itemDTO.getQuantity());
                item.setUnitPrice(itemDTO.getUnitPrice());
                item.setSubtotal(itemDTO.getUnitPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity())));
                saleItemRepository.save(item);

                // Deduct stock
                p.setStockLevel(p.getStockLevel() - itemDTO.getQuantity());
                productRepository.save(p);

                // Log movement OUT
                InventoryMovement movement = new InventoryMovement();
                movement.setProduct(p);
                movement.setMovementType("OUT");
                movement.setQuantity(itemDTO.getQuantity());
                movement.setNotes("Venta #" + savedSale.getId() + " | " + p.getName()
                        + " | Pago: " + savedSale.getPaymentMethod()
                        + (savedSale.getCustomer() != null ? " | Cliente: " + savedSale.getCustomer().getName() : ""));
                movement.setMovementDate(LocalDateTime.now());
                movement.setReference("VENTA-" + savedSale.getId());
                userRepository.findById(request.getUserId() != null ? request.getUserId() : 1L)
                        .ifPresent(movement::setUser);
                movementRepository.save(movement);
            }

            // Return the saved sale with items
            return ResponseEntity.ok(saleRepository.findById(savedSale.getId()).get());

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al registrar venta: " + e.getMessage());
        }
    }

    // DELETE a sale (and restore stock)
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteSale(@PathVariable Long id) {
        return saleRepository.findById(id).map(sale -> {
            // Restore stock for each item
            List<SaleItem> items = saleItemRepository.findBySaleId(id);
            for (SaleItem item : items) {
                if (item.getProduct() != null) {
                    Product p = item.getProduct();
                    p.setStockLevel(p.getStockLevel() + item.getQuantity());
                    productRepository.save(p);
                }
            }
            saleRepository.delete(sale);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}

// DTO classes (inner)
class SaleDTO {
    private Long userId;
    private Long customerId;
    private String paymentMethod;
    private BigDecimal taxAmount;
    private String notes;
    private List<SaleItemDTO> items;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public List<SaleItemDTO> getItems() { return items; }
    public void setItems(List<SaleItemDTO> items) { this.items = items; }
}

class SaleItemDTO {
    private Long productId;
    private Integer quantity;
    private BigDecimal unitPrice;

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
}
