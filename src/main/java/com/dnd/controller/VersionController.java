
package com.dnd.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class VersionController {

    private final ObjectMapper objectMapper;

    public VersionController() {
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Pobierz informacje o wersji aplikacji
     */
    @GetMapping("/version")
    public ResponseEntity<Map<String, Object>> getVersion() {
        try {
            // Próbuj wczytać z pliku version.json
            File versionFile = new File("version.json");
            if (versionFile.exists()) {
                String content = Files.readString(Paths.get("version.json"));
                @SuppressWarnings("unchecked")
                Map<String, Object> versionData = objectMapper.readValue(content, Map.class);
                return ResponseEntity.ok(versionData);
            } else {
                // Fallback - domyślne wartości
                Map<String, Object> defaultVersion = new HashMap<>();
                defaultVersion.put("build", 1);
                defaultVersion.put("buildDate", "2025-01-17 00:00");
                return ResponseEntity.ok(defaultVersion);
            }
        } catch (IOException e) {
            // Error fallback
            Map<String, Object> errorVersion = new HashMap<>();
            errorVersion.put("build", 0);
            errorVersion.put("buildDate", "unknown");
            return ResponseEntity.ok(errorVersion);
        }
    }
}
