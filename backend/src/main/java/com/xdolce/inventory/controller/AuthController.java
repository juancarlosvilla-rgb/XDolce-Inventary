package com.xdolce.inventory.controller;

import com.xdolce.inventory.dto.ApiResponse;
import com.xdolce.inventory.dto.LoginRequest;
import com.xdolce.inventory.model.User;
import com.xdolce.inventory.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<User>> login(@RequestBody LoginRequest loginRequest) {
        Optional<User> userOpt = userRepository.findByUsername(loginRequest.getUsername());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPasswordHash().equals(loginRequest.getPassword())) {
                return ResponseEntity.ok(new ApiResponse<>(true, "Login exitoso", user));
            }
        }
        return ResponseEntity.status(401).body(new ApiResponse<>(false, "Credenciales incorrectas", null));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<User>> register(@RequestBody User newUser) {
        if (userRepository.findByUsername(newUser.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "El nombre de usuario ya existe", null));
        }
        User savedUser = userRepository.save(newUser);
        return ResponseEntity.ok(new ApiResponse<>(true, "Registro exitoso", savedUser));
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (username == null || currentPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Datos incompletos", null));
        }
        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "La nueva contraseña debe tener al menos 6 caracteres", null));
        }

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new ApiResponse<>(false, "Usuario no encontrado", null));
        }

        User user = userOpt.get();
        if (!user.getPasswordHash().equals(currentPassword)) {
            return ResponseEntity.status(401).body(new ApiResponse<>(false, "Contraseña actual incorrecta", null));
        }

        user.setPasswordHash(newPassword);
        userRepository.save(user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Contraseña actualizada exitosamente", null));
    }

    @PutMapping("/profile/{id}")
    public ResponseEntity<ApiResponse<User>> updateProfile(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return userRepository.findById(id).map(user -> {
            if (body.containsKey("fullName")) user.setFullName(body.get("fullName"));
            if (body.containsKey("email")) user.setEmail(body.get("email"));
            User saved = userRepository.save(user);
            return ResponseEntity.ok(new ApiResponse<>(true, "Perfil actualizado", saved));
        }).orElse(ResponseEntity.status(404).body(new ApiResponse<>(false, "Usuario no encontrado", null)));
    }
}
