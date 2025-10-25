package com.dnd.controller;

import com.dnd.model.MapInfo;
import com.dnd.service.MapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/maps")
public class MapController {

    private final MapService mapService;

    @Autowired
    public MapController(MapService mapService) {
        this.mapService = mapService;
    }

    @GetMapping
    public ResponseEntity<List<MapInfo>> getAllMaps() {
        List<MapInfo> maps = mapService.getAllMaps();
        return ResponseEntity.ok(maps);
    }

    @GetMapping("/{mapName}")
    public ResponseEntity<MapInfo> getMap(@PathVariable String mapName) {
        MapInfo map = mapService.getMapByName(mapName);

        if (map == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(map);
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadMap(
            @RequestParam("file") MultipartFile file,
            @RequestParam("name") String mapName) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Plik jest pusty");
        }

        try {
            mapService.uploadMap(file, mapName);
            return ResponseEntity.ok("Mapa została dodana pomyślnie");
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body("Błąd podczas zapisywania pliku: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{mapName}")
    public ResponseEntity<String> deleteMap(@PathVariable String mapName) {
        try {
            boolean deleted = mapService.deleteMap(mapName);
            if (deleted) {
                return ResponseEntity.ok("Mapa została usunięta");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body("Błąd podczas usuwania mapy: " + e.getMessage());
        }
    }
}
