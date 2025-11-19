package com.dnd.controller;

import com.dnd.service.PreviewMapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/preview-map")
public class PreviewMapController {
    private final PreviewMapService previewMapService;

    @Autowired
    public PreviewMapController(PreviewMapService previewMapService) {
        this.previewMapService = previewMapService;
    }

    @GetMapping
    public ResponseEntity<String> getPreviewMap() {
        String mapName = previewMapService.getPreviewMapName();
        if (mapName == null || mapName.isBlank()) {
            // Zwróć 200 z pustą wartością zamiast 404 (frontend sam obsłuży brak ustawionej mapy)
            return ResponseEntity.ok("");
        }
        return ResponseEntity.ok(mapName);
    }

    @PostMapping
    public ResponseEntity<Void> setPreviewMap(@RequestBody String mapName) {
        previewMapService.setPreviewMapName(mapName);
        previewMapService.requestRefresh(); // wymuś odświeżenie podglądu
        previewMapService.enableViewportFrame(); // włącz ramkę viewport po załadowaniu mapy
        return ResponseEntity.ok().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> requestRefresh() {
        previewMapService.requestRefresh();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/viewport/enable")
    public ResponseEntity<Void> enableViewportFrame() {
        previewMapService.enableViewportFrame();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/viewport/disable")
    public ResponseEntity<Void> disableViewportFrame() {
        previewMapService.disableViewportFrame();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("viewportFrameEnabled", previewMapService.isViewportFrameEnabled());
        status.put("refreshRequested", previewMapService.isRefreshRequested());
        status.put("fogSaveInProgress", previewMapService.isFogSaveInProgress());
        status.put("previewMapName", previewMapService.getPreviewMapName());
        return ResponseEntity.ok(status);
    }

    @PostMapping("/force-refresh")
    public ResponseEntity<Void> forceRefresh() {
        previewMapService.forceRefresh();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/check-refresh")
    public ResponseEntity<Boolean> isRefreshRequested() {
        boolean refresh = previewMapService.isRefreshRequested();
        if (refresh) previewMapService.clearRefreshRequest();
        return ResponseEntity.ok(refresh);
    }

    @PostMapping("/navigation")
    public ResponseEntity<Void> sendNavigationCommand(@RequestBody Map<String, String> command) {
        previewMapService.setNavigationCommand(command);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/navigation")
    public ResponseEntity<Map<String, String>> getNavigationCommand() {
        Map<String, String> command = previewMapService.getNavigationCommand();
        return ResponseEntity.ok(command);
    }

    @PostMapping("/viewport")
    public ResponseEntity<Void> updateViewport(@RequestBody Map<String, Object> viewport) {
        previewMapService.setViewport(viewport);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/viewport")
    public ResponseEntity<Map<String, Object>> getViewport() {
        Map<String, Object> viewport = previewMapService.getViewport();
        return ResponseEntity.ok(viewport);
    }

    @PostMapping("/refresh-fog")
    public ResponseEntity<Void> refreshFog() {
        previewMapService.requestRefresh();
        System.out.println("🔄 Otrzymano polecenie odświeżenia mgły z GM");
        return ResponseEntity.ok().build();
    }
}
