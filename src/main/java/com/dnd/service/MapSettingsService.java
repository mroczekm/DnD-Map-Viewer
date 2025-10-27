package com.dnd.service;

import com.dnd.config.MapConfiguration;
import com.dnd.model.MapSettings;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class MapSettingsService {

    private final MapConfiguration mapConfiguration;
    private final ObjectMapper objectMapper;

    @Autowired
    public MapSettingsService(MapConfiguration mapConfiguration, ObjectMapper objectMapper) {
        this.mapConfiguration = mapConfiguration;
        this.objectMapper = objectMapper;
    }

    public void saveMapSettings(String mapName, MapSettings settings) throws IOException {
        // Utwórz katalog settings jeśli nie istnieje
        String settingsDir = mapConfiguration.getSettings().getDirectory();
        Path settingsDirPath = Paths.get(settingsDir);
        if (!Files.exists(settingsDirPath)) {
            Files.createDirectories(settingsDirPath);
        }

        // Zapisz ustawienia do pliku
        String fileName = mapName + "_settings.json";
        File file = new File(settingsDir, fileName);

        objectMapper.writerWithDefaultPrettyPrinter().writeValue(file, settings);

        System.out.println("Zapisano ustawienia mapy: " + mapName + " do pliku: " + file.getAbsolutePath());
    }

    public MapSettings loadMapSettings(String mapName) {
        try {
            String settingsDir = mapConfiguration.getSettings().getDirectory();
            String fileName = mapName + "_settings.json";
            File file = new File(settingsDir, fileName);

            if (!file.exists()) {
                System.out.println("Brak zapisanych ustawień dla mapy: " + mapName);
                return null;
            }

            MapSettings settings = objectMapper.readValue(file, MapSettings.class);
            System.out.println("Wczytano ustawienia mapy: " + mapName);
            return settings;

        } catch (IOException e) {
            System.err.println("Błąd wczytywania ustawień mapy " + mapName + ": " + e.getMessage());
            return null;
        }
    }

    public boolean deleteMapSettings(String mapName) {
        try {
            String settingsDir = mapConfiguration.getSettings().getDirectory();
            String fileName = mapName + "_settings.json";
            File file = new File(settingsDir, fileName);

            if (file.exists()) {
                boolean deleted = file.delete();
                if (deleted) {
                    System.out.println("Usunięto ustawienia mapy: " + mapName);
                }
                return deleted;
            }
            return false;
        } catch (Exception e) {
            System.err.println("Błąd usuwania ustawień mapy " + mapName + ": " + e.getMessage());
            return false;
        }
    }
}

