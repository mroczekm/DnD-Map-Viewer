package com.dnd.controller;

import com.dnd.model.FogState;
import com.dnd.service.FogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/fog-states")
public class FogStateController {

    private final FogService fogService;

    @Autowired
    public FogStateController(FogService fogService) {
        this.fogService = fogService;
    }

    @GetMapping("/{mapName}")
    public ResponseEntity<FogState> getFogState(@PathVariable String mapName) {
        try {
            FogState fogState = fogService.getFogState(mapName);
            if (fogState == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(fogState);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{mapName}")
    public ResponseEntity<Void> saveFogState(
            @PathVariable String mapName,
            @RequestBody FogState fogState) {
        try {
            // Set the map name and save using the single-parameter method
            fogState.setMapName(mapName);
            fogService.saveFogState(fogState);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{mapName}/hash")
    public ResponseEntity<Map<String, String>> getFogStateHash(@PathVariable String mapName) {
        try {
            // Create a simple hash from the fog state
            FogState fogState = fogService.getFogState(mapName);
            String hash = "";
            if (fogState != null && fogState.getRevealedAreas() != null) {
                // Create hash based on the number of areas and their coordinates
                StringBuilder hashBuilder = new StringBuilder();
                hashBuilder.append("areas:").append(fogState.getRevealedAreas().size());

                long coordSum = fogState.getRevealedAreas().stream()
                    .mapToLong(area -> area.getX() + area.getY() + area.getRadius())
                    .sum();
                hashBuilder.append(":sum:").append(coordSum);

                hash = String.valueOf(hashBuilder.toString().hashCode());
            }

            Map<String, String> response = new HashMap<>();
            response.put("hash", hash);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("hash", "");
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/{mapName}/reset")
    public ResponseEntity<Void> resetFogState(@PathVariable String mapName) {
        try {
            fogService.resetFog(mapName);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
