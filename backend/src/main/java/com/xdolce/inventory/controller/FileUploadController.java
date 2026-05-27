package com.xdolce.inventory.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

    private final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/";

    @PostMapping
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        Map<String, String> response = new HashMap<>();
        try {
            if (file.isEmpty()) {
                response.put("error", "El archivo está vacío.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // Validar tamaño máximo (5MB)
            long MAX_SIZE = 5 * 1024 * 1024;
            if (file.getSize() > MAX_SIZE) {
                response.put("error", "El archivo excede el tamaño máximo permitido de 5MB.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // Validar formatos permitidos
            String contentType = file.getContentType();
            if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("image/webp"))) {
                response.put("error", "Formato de archivo no válido. Solo se permiten imágenes JPG, PNG o WEBP.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // Create uploads directory if it doesn't exist
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = "";
            int dotIndex = originalFileName.lastIndexOf('.');
            if(dotIndex > 0) {
                fileExtension = originalFileName.substring(dotIndex);
            }
            String fileName = UUID.randomUUID().toString() + fileExtension;

            // Save file
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/uploads/" + fileName;
            response.put("url", fileUrl);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            response.put("error", "Could not upload the file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
