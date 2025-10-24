package com.dnd.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/characters")
public class CharactersController {

    // Przechowywanie postaci w pamięci serwera (dla każdej mapy osobno)
    private final Map<String, Map<String, Object>> charactersData = new ConcurrentHashMap<>();

    @GetMapping("/{mapName}")
    public ResponseEntity<Map<String, Object>> getCharacters(@PathVariable String mapName) {
        Map<String, Object> data = charactersData.getOrDefault(mapName, createDefaultData());
        return ResponseEntity.ok(data);
    }

    @PostMapping("/{mapName}")
    public ResponseEntity<Void> saveCharacters(@PathVariable String mapName, @RequestBody Map<String, Object> data) {
        charactersData.put(mapName, data);
        return ResponseEntity.ok().build();
    }

    private Map<String, Object> createDefaultData() {
        Map<String, Object> data = new HashMap<>();
        Map<String, List<Object>> characters = new HashMap<>();
        characters.put("players", new ArrayList<>());
        characters.put("enemies", new ArrayList<>());
        data.put("characters", characters);
        data.put("playerColor", "#00ff00");
        data.put("enemyColor", "#ff0000");
        return data;
    }
}

