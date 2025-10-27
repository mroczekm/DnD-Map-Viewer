package com.dnd.service;

import com.dnd.config.MapConfiguration;
import com.dnd.model.CharacterData;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class CharacterService {

    private final MapConfiguration mapConfiguration;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public CharacterService(MapConfiguration mapConfiguration) {
        this.mapConfiguration = mapConfiguration;

        // Utwórz katalog na postacie jeśli nie istnieje
        File dir = new File(mapConfiguration.getCharacters().getDirectory());
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    public void saveCharacters(String mapName, CharacterData data) {
        try {
            String charactersDir = mapConfiguration.getCharacters().getDirectory();
            File file = new File(charactersDir, mapName + "_characters.json");
            objectMapper.writeValue(file, data);
            System.out.println("Zapisano postacie dla mapy: " + mapName);
        } catch (IOException e) {
            System.err.println("Błąd zapisywania postaci dla mapy " + mapName + ": " + e.getMessage());
        }
    }

    public CharacterData loadCharacters(String mapName) {
        try {
            String charactersDir = mapConfiguration.getCharacters().getDirectory();
            File file = new File(charactersDir, mapName + "_characters.json");
            if (file.exists()) {
                return objectMapper.readValue(file, CharacterData.class);
            }
        } catch (IOException e) {
            System.err.println("Błąd wczytywania postaci dla mapy " + mapName + ": " + e.getMessage());
        }
        return new CharacterData(); // Zwróć pustą strukturę
    }

    public void deleteCharacters(String mapName) {
        try {
            String charactersDir = mapConfiguration.getCharacters().getDirectory();
            File file = new File(charactersDir, mapName + "_characters.json");
            if (file.exists()) {
                file.delete();
                System.out.println("Usunięto postacie dla mapy: " + mapName);
            }
        } catch (Exception e) {
            System.err.println("Błąd usuwania postaci dla mapy " + mapName + ": " + e.getMessage());
        }
    }
}

