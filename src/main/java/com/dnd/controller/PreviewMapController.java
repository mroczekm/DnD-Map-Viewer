package com.dnd.controller;

import com.dnd.service.PreviewMapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        if (mapName == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(mapName);
    }

    @PostMapping
    public ResponseEntity<Void> setPreviewMap(@RequestBody String mapName) {
        previewMapService.setPreviewMapName(mapName);
        previewMapService.requestRefresh(); // wymuś odświeżenie podglądu
        return ResponseEntity.ok().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> requestRefresh() {
        previewMapService.requestRefresh();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/refresh")
    public ResponseEntity<Boolean> isRefreshRequested() {
        boolean refresh = previewMapService.isRefreshRequested();
        if (refresh) previewMapService.clearRefreshRequest();
        return ResponseEntity.ok(refresh);
    }
}
