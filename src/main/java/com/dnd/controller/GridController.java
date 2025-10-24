package com.dnd.controller;

import com.dnd.service.GridService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/grid")
public class GridController {
    private final GridService gridService;

    @Autowired
    public GridController(GridService gridService) {
        this.gridService = gridService;
    }

    @GetMapping("/{mapName}")
    public ResponseEntity<GridService.GridConfig> getGridConfig(@PathVariable String mapName) {
        GridService.GridConfig config = gridService.getGridConfig(mapName);
        if (config == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(config);
    }

    @PostMapping("/{mapName}")
    public ResponseEntity<?> setGridConfig(
            @PathVariable String mapName,
            @RequestBody GridConfigRequest request) {
        if (request.getGridSize() <= 0) {
            return ResponseEntity.badRequest().body("gridSize must be > 0");
        }
        gridService.setGridConfig(mapName, request.getGridSize(), request.getOffsetX(), request.getOffsetY());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{mapName}")
    public ResponseEntity<Void> clearGridConfig(@PathVariable String mapName) {
        gridService.clearGridConfig(mapName);
        return ResponseEntity.ok().build();
    }

    public static class GridConfigRequest {
        private int gridSize;
        private double offsetX;
        private double offsetY;

        public int getGridSize() { return gridSize; }
        public void setGridSize(int gridSize) { this.gridSize = gridSize; }

        public double getOffsetX() { return offsetX; }
        public void setOffsetX(double offsetX) { this.offsetX = offsetX; }

        public double getOffsetY() { return offsetY; }
        public void setOffsetY(double offsetY) { this.offsetY = offsetY; }
    }
}
