package com.dnd.controller;

import com.dnd.model.MapInfo;
import com.dnd.service.MapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
