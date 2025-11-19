package com.dnd.controller;

import com.dnd.service.MapDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/map-data")
public class MapDataController {

    private final MapDataService mapDataService;

    @Autowired
    public MapDataController(MapDataService mapDataService) {
        this.mapDataService = mapDataService;
    }

    /**
     * Zapisz wszystkie dane mapy do jednego pliku JSON
     */
    @PostMapping("/{mapName}")
    public ResponseEntity<String> saveMapData(@PathVariable String mapName, @RequestBody Map<String, Object> mapData) {
        try {
            // DIAGNOSTYKA - sprawdź kto nadpisuje dane
            System.out.println("🔍 MapDataController.saveMapData wywoływane dla: " + mapName);
            System.out.println("   Klucze w otrzymanych danych: " + mapData.keySet());
            if (mapData.containsKey("fog")) {
                System.out.println("   ✅ Otrzymane dane ZAWIERAJĄ sekcję fog");
            } else {
                System.out.println("   ❌ Otrzymane dane NIE ZAWIERAJĄ sekcji fog!");
                // Wypisz stack trace żeby zobaczyć kto to wywołuje
                Thread.dumpStack();
            }

            mapDataService.saveMapData(mapName, mapData);
            return ResponseEntity.ok("Map data saved successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error saving map data: " + e.getMessage());
        }
    }

    /**
     * Załaduj wszystkie dane mapy z pliku JSON
     */
    @GetMapping("/{mapName}")
    public ResponseEntity<Map<String, Object>> getMapData(@PathVariable String mapName) {
        try {
            Map<String, Object> mapData = mapDataService.getMapData(mapName);
            if (mapData == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(mapData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }

    /**
     * Usuń plik danych mapy
     */
    @DeleteMapping("/{mapName}")
    public ResponseEntity<String> deleteMapData(@PathVariable String mapName) {
        try {
            boolean deleted = mapDataService.deleteMapData(mapName);
            if (deleted) {
                return ResponseEntity.ok("Map data deleted successfully");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error deleting map data: " + e.getMessage());
        }
    }
}
