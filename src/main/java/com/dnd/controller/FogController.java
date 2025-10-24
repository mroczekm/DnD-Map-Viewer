package com.dnd.controller;

import com.dnd.model.FogState;
import com.dnd.service.FogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

@RestController
@RequestMapping("/api/fog")
public class FogController {

    private final FogService fogService;

    @Autowired
    public FogController(FogService fogService) {
        this.fogService = fogService;
    }

    @GetMapping("/{mapName}")
    public ResponseEntity<FogState> getFogState(@PathVariable String mapName) {
        FogState fogState = fogService.getFogState(mapName);
        return ResponseEntity.ok(fogState);
    }

    @PostMapping("/{mapName}/reveal")
    public ResponseEntity<Void> revealArea(
            @PathVariable String mapName,
            @RequestParam int x,
            @RequestParam int y,
            @RequestParam(defaultValue = "50") int radius) {

        fogService.addRevealedArea(mapName, x, y, radius);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{mapName}/reveal-batch")
    public ResponseEntity<Void> revealAreas(
            @PathVariable String mapName,
            @RequestBody List<FogPoint> points) {

        fogService.addRevealedAreas(mapName, points);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{mapName}/hide-batch")
    public ResponseEntity<Void> hideAreas(
            @PathVariable String mapName,
            @RequestBody List<FogPoint> points) {

        fogService.removeRevealedAreas(mapName, points);
        return ResponseEntity.ok().build();
    }

    public static class FogPoint {
        private int x;
        private int y;
        private int radius;
        @JsonProperty("isGridCell")
        private boolean isGridCell; // nowe pole do odróżnienia typu odsłonięcia

        public FogPoint() {}
        public FogPoint(int x, int y, int radius) { this.x = x; this.y = y; this.radius = radius; }
        public FogPoint(int x, int y, int radius, boolean isGridCell) { this.x = x; this.y = y; this.radius = radius; this.isGridCell = isGridCell; }

        public int getX() { return x; }
        public void setX(int x) { this.x = x; }
        public int getY() { return y; }
        public void setY(int y) { this.y = y; }
        public int getRadius() { return radius; }
        public void setRadius(int radius) { this.radius = radius; }

        @JsonProperty("isGridCell")
        public boolean isGridCell() { return isGridCell; }
        @JsonProperty("isGridCell")
        public void setGridCell(boolean gridCell) { isGridCell = gridCell; }
    }

    @PostMapping("/{mapName}/reset")
    public ResponseEntity<Void> resetFog(@PathVariable String mapName) {
        fogService.resetFog(mapName);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{mapName}/reveal-cell")
    public ResponseEntity<Void> revealCell(@PathVariable String mapName, @RequestBody FogPoint point) {
        try {
            fogService.revealFogPoint(mapName, point.getX(), point.getY(), point.getRadius(), point.isGridCell());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{mapName}/reveal-point")
    public ResponseEntity<Void> revealPoint(@PathVariable String mapName, @RequestBody FogPoint point) {
        try {
            fogService.revealFogPoint(mapName, point.getX(), point.getY(), point.getRadius(), point.isGridCell());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
