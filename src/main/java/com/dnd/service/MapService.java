package com.dnd.service;

import com.dnd.config.MapConfiguration;
import com.dnd.model.MapInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MapService {

    private final MapConfiguration mapConfiguration;
    private static final List<String> SUPPORTED_FORMATS = Arrays.asList(".jpg", ".jpeg", ".png", ".gif");

    @Autowired
    public MapService(MapConfiguration mapConfiguration) {
        this.mapConfiguration = mapConfiguration;
        createDirectoriesIfNotExist();
    }

    private void createDirectoriesIfNotExist() {
        try {
            Path mapsDir = Paths.get(mapConfiguration.getMaps().getDirectory());
            Path fogStatesDir = Paths.get(mapConfiguration.getFogStates().getDirectory());

            Files.createDirectories(mapsDir);
            Files.createDirectories(fogStatesDir);
        } catch (IOException e) {
            throw new RuntimeException("Nie można utworzyć katalogów", e);
        }
    }

    public List<MapInfo> getAllMaps() {
        List<MapInfo> maps = new ArrayList<>();
        File mapsDirectory = new File(mapConfiguration.getMaps().getDirectory());

        if (!mapsDirectory.exists() || !mapsDirectory.isDirectory()) {
            return maps;
        }

        File[] files = mapsDirectory.listFiles((dir, name) -> {
            String lowerName = name.toLowerCase();
            return SUPPORTED_FORMATS.stream().anyMatch(lowerName::endsWith);
        });

        if (files != null) {
            for (File file : files) {
                try {
                    BufferedImage image = ImageIO.read(file);
                    if (image != null) {
                        String name = file.getName().substring(0, file.getName().lastIndexOf('.'));
                        maps.add(new MapInfo(name, file.getName(), image.getWidth(), image.getHeight()));
                    }
                } catch (IOException e) {
                    System.err.println("Błąd odczytu pliku mapy: " + file.getName());
                }
            }
        }

        return maps;
    }

    public MapInfo getMapByName(String mapName) {
        return getAllMaps().stream()
                .filter(map -> map.getName().equals(mapName))
                .findFirst()
                .orElse(null);
    }

    public boolean mapExists(String mapName) {
        return getMapByName(mapName) != null;
    }

    public void uploadMap(MultipartFile file, String mapName) throws IOException {
        // Walidacja nazwy mapy
        if (mapName == null || mapName.trim().isEmpty()) {
            throw new IllegalArgumentException("Nazwa mapy nie może być pusta");
        }

        // Sprawdź czy mapa już istnieje
        if (mapExists(mapName)) {
            throw new IllegalArgumentException("Mapa o nazwie '" + mapName + "' już istnieje");
        }

        // Sprawdź rozszerzenie pliku
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IllegalArgumentException("Nieprawidłowa nazwa pliku");
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf('.')).toLowerCase();
        if (!SUPPORTED_FORMATS.contains(extension)) {
            throw new IllegalArgumentException("Nieobsługiwany format pliku. Obsługiwane: " +
                    String.join(", ", SUPPORTED_FORMATS));
        }

        // Zapisz plik
        String filename = mapName + extension;
        Path targetPath = Paths.get(mapConfiguration.getMaps().getDirectory(), filename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
    }

    public boolean deleteMap(String mapName) throws IOException {
        MapInfo map = getMapByName(mapName);
        if (map == null) {
            return false;
        }

        // Usuń plik mapy
        Path mapPath = Paths.get(mapConfiguration.getMaps().getDirectory(), map.getFilename());
        Files.deleteIfExists(mapPath);

        // Usuń powiązane pliki (fog state, grid config, characters, settings)
        String fogStateFilename = mapName + ".json";
        Path fogStatePath = Paths.get(mapConfiguration.getFogStates().getDirectory(), fogStateFilename);
        Files.deleteIfExists(fogStatePath);

        // Usuń grid config
        Path gridConfigPath = Paths.get(mapConfiguration.getGridConfigs().getDirectory(), mapName + "_grid.json");
        Files.deleteIfExists(gridConfigPath);

        // Usuń characters
        Path charactersPath = Paths.get(mapConfiguration.getCharacters().getDirectory(), mapName + "_characters.json");
        Files.deleteIfExists(charactersPath);

        // Usuń settings
        Path settingsPath = Paths.get(mapConfiguration.getSettings().getDirectory(), mapName + "_settings.json");
        Files.deleteIfExists(settingsPath);

        return true;
    }
}
