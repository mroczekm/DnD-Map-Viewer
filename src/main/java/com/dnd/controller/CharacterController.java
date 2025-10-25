package com.dnd.controller;

import com.dnd.model.CharacterData;
import com.dnd.service.CharacterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/characters")
public class CharacterController {

    private final CharacterService characterService;

    @Autowired
    public CharacterController(CharacterService characterService) {
        this.characterService = characterService;
    }

    @GetMapping("/{mapName}")
    public ResponseEntity<CharacterData> getCharacters(@PathVariable String mapName) {
        CharacterData data = characterService.loadCharacters(mapName);
        return ResponseEntity.ok(data);
    }

    @PostMapping("/{mapName}")
    public ResponseEntity<Void> saveCharacters(@PathVariable String mapName, @RequestBody CharacterData data) {
        characterService.saveCharacters(mapName, data);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{mapName}")
    public ResponseEntity<Void> deleteCharacters(@PathVariable String mapName) {
        characterService.deleteCharacters(mapName);
        return ResponseEntity.ok().build();
    }
}

