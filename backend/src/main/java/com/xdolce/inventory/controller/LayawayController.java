package com.xdolce.inventory.controller;

import com.xdolce.inventory.model.InventoryMovement;
import com.xdolce.inventory.model.Layaway;
import com.xdolce.inventory.repository.InventoryMovementRepository;
import com.xdolce.inventory.repository.LayawayRepository;
import com.xdolce.inventory.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/layaways")
public class LayawayController {

    @Autowired
    private LayawayRepository layawayRepository;

    @Autowired
    private InventoryMovementRepository movementRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<Layaway> getAllLayaways() {
        return layawayRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Layaway> getById(@PathVariable Long id) {
        return layawayRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Layaway> createLayaway(@RequestBody Layaway layaway) {
        if (layaway.getPaidAmount() == null) layaway.setPaidAmount(BigDecimal.ZERO);
        if (layaway.getStatus() == null) layaway.setStatus("ACTIVE");
        if (layaway.getQuantity() == null) layaway.setQuantity(1);

        Layaway saved = layawayRepository.save(layaway);

        // Log to history
        InventoryMovement movement = new InventoryMovement();
        movement.setProduct(saved.getProduct());
        movement.setMovementType("LAYAWAY_CREATE");
        movement.setQuantity(saved.getQuantity());
        movement.setNotes("Apartado creado para: " + (saved.getCustomer() != null ? saved.getCustomer().getName() : "N/A")
                + " | Total: " + saved.getTotalAmount() + " | Abono: " + saved.getPaidAmount());
        movement.setMovementDate(LocalDateTime.now());
        userRepository.findById(1L).ifPresent(movement::setUser);
        movementRepository.save(movement);

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Layaway> updateLayaway(@PathVariable Long id, @RequestBody Layaway layawayDetails) {
        return layawayRepository.findById(id).map(layaway -> {
            if (layawayDetails.getCustomer() != null) layaway.setCustomer(layawayDetails.getCustomer());
            if (layawayDetails.getProduct() != null) layaway.setProduct(layawayDetails.getProduct());
            if (layawayDetails.getQuantity() != null) layaway.setQuantity(layawayDetails.getQuantity());
            if (layawayDetails.getTotalAmount() != null) layaway.setTotalAmount(layawayDetails.getTotalAmount());
            if (layawayDetails.getDueDate() != null) layaway.setDueDate(layawayDetails.getDueDate());
            if (layawayDetails.getNotes() != null) layaway.setNotes(layawayDetails.getNotes());
            return ResponseEntity.ok(layawayRepository.save(layaway));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/pay")
    public ResponseEntity<?> addPayment(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return layawayRepository.findById(id).map(layaway -> {
            if (layaway.getStatus().equals("CANCELLED")) {
                return ResponseEntity.badRequest().body("El apartado está cancelado.");
            }

            BigDecimal amount = new BigDecimal(body.get("paidAmount").toString());
            BigDecimal remaining = layaway.getTotalAmount().subtract(layaway.getPaidAmount());

            if (amount.compareTo(remaining) > 0) {
                return ResponseEntity.badRequest().body("El monto supera el saldo restante de " + remaining);
            }

            layaway.setPaidAmount(layaway.getPaidAmount().add(amount));
            if (layaway.getPaidAmount().compareTo(layaway.getTotalAmount()) >= 0) {
                layaway.setStatus("READY");
            }

            Layaway saved = layawayRepository.save(layaway);

            // Log payment to history
            InventoryMovement movement = new InventoryMovement();
            movement.setProduct(saved.getProduct());
            movement.setMovementType("LAYAWAY_PAYMENT");
            movement.setQuantity(saved.getQuantity());
            movement.setNotes("Pago de apartado: " + amount + " COP | Cliente: "
                    + (saved.getCustomer() != null ? saved.getCustomer().getName() : "N/A")
                    + " | Estado: " + saved.getStatus());
            movement.setMovementDate(LocalDateTime.now());
            userRepository.findById(1L).ifPresent(movement::setUser);
            movementRepository.save(movement);

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Layaway> cancelLayaway(@PathVariable Long id) {
        return layawayRepository.findById(id).map(layaway -> {
            layaway.setStatus("CANCELLED");
            Layaway saved = layawayRepository.save(layaway);

            InventoryMovement movement = new InventoryMovement();
            movement.setProduct(saved.getProduct());
            movement.setMovementType("LAYAWAY_CANCEL");
            movement.setQuantity(saved.getQuantity());
            movement.setNotes("Apartado cancelado | Cliente: " + (saved.getCustomer() != null ? saved.getCustomer().getName() : "N/A"));
            movement.setMovementDate(LocalDateTime.now());
            userRepository.findById(1L).ifPresent(movement::setUser);
            movementRepository.save(movement);

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLayaway(@PathVariable Long id) {
        return layawayRepository.findById(id).map(layaway -> {
            layawayRepository.delete(layaway);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
