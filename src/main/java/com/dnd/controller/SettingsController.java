package com.dnd.controller;

import com.dnd.model.MapSettings;
import com.dnd.service.MapSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final MapSettingsService mapSettingsService;

    @Autowired
    public SettingsController(MapSettingsService mapSettingsService) {
        this.mapSettingsService = mapSettingsService;
    }

    @PostMapping("/{mapName}")
    public ResponseEntity<String> saveMapSettings(
            @PathVariable String mapName,
            @RequestBody MapSettings settings) {
        try {
            mapSettingsService.saveMapSettings(mapName, settings);
            return ResponseEntity.ok("Ustawienia zapisane pomyślnie");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Błąd zapisu ustawień: " + e.getMessage());
        }
    }

    @GetMapping("/{mapName}")
    public ResponseEntity<MapSettings> getMapSettings(@PathVariable String mapName) {
        try {
            MapSettings settings = mapSettingsService.loadMapSettings(mapName);
            if (settings != null) {
                return ResponseEntity.ok(settings);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{mapName}")
    public ResponseEntity<String> deleteMapSettings(@PathVariable String mapName) {
        try {
            boolean deleted = mapSettingsService.deleteMapSettings(mapName);
            if (deleted) {
                return ResponseEntity.ok("Ustawienia usunięte pomyślnie");
            } else {
                return ResponseEntity.status(404).body("Ustawienia nie znalezione");
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Błąd usuwania ustawień: " + e.getMessage());
        }
    }
}
