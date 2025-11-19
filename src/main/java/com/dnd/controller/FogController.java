package com.dnd.controller;

import com.dnd.model.FogState;
import com.dnd.service.FogService;
import com.dnd.service.PreviewMapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

@RestController
@RequestMapping("/api/fog")
public class FogController {

    private final FogService fogService;
    private final PreviewMapService previewMapService;

    @Autowired
    public FogController(FogService fogService, PreviewMapService previewMapService) {
        this.fogService = fogService;
        this.previewMapService = previewMapService;
    }

    @GetMapping("/{mapName}")
    public ResponseEntity<FogState> getFogState(@PathVariable String mapName) {
        FogState fogState = fogService.getFogState(mapName);

        // ZAWSZE loguj żeby zobaczyć dokładnie co podgląd pobiera
        System.out.println("📡 PODGLĄD POBIERA: " + mapName + " → " +
            fogState.getRevealedAreas().size() + " obszarów mgły");

        return ResponseEntity.ok(fogState);
    }

    @PostMapping("/{mapName}/reveal")
    public ResponseEntity<Void> revealArea(
            @PathVariable String mapName,
            @RequestParam int x,
            @RequestParam int y,
            @RequestParam(defaultValue = "50") int radius) {

        fogService.addRevealedArea(mapName, x, y, radius);

        // Natychmiastowe odświeżenie podglądu po zmianie mgły
        if (mapName.equals(previewMapService.getPreviewMapName())) {
            previewMapService.requestRefresh();
        }

        return ResponseEntity.ok().build();
    }

    @PostMapping("/{mapName}/reveal-batch")
    public ResponseEntity<Void> revealAreas(
            @PathVariable String mapName,
            @RequestBody List<FogPoint> points) {

        fogService.addRevealedAreas(mapName, points);

        // PROSTY refresh request - podgląd pobierze mgłę w swoim polling
        if (mapName.equals(previewMapService.getPreviewMapName())) {
            previewMapService.requestRefresh();
        }

        return ResponseEntity.ok().build();
    }

    @PostMapping("/{mapName}/hide-batch")
    public ResponseEntity<Void> hideAreas(
            @PathVariable String mapName,
            @RequestBody List<FogPoint> points) {

        fogService.removeRevealedAreas(mapName, points);

        // PROSTY refresh request - podgląd pobierze mgłę w swoim polling
        if (mapName.equals(previewMapService.getPreviewMapName())) {
            previewMapService.requestRefresh();
        }

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

    @PostMapping("/{mapName}/batch")
    public ResponseEntity<Void> processBatch(
            @PathVariable String mapName,
            @RequestBody List<BatchFogPoint> points) {
        try {
            for (BatchFogPoint point : points) {
                if ("erase".equals(point.getAction())) {
                    fogService.revealFogPoint(mapName, point.getX(), point.getY(), point.getRadius(), point.isGridCell());
                } else if ("paint".equals(point.getAction())) {
                    // For paint action, we need to remove revealed areas
                    FogPoint pointToRemove = new FogPoint(point.getX(), point.getY(), point.getRadius());
                    pointToRemove.setGridCell(point.isGridCell());
                    List<FogPoint> pointsToRemove = List.of(pointToRemove);
                    fogService.removeRevealedAreas(mapName, pointsToRemove);
                }
            }
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    public static class BatchFogPoint extends FogPoint {
        private String action;

        public BatchFogPoint() {}

        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
    }
}
