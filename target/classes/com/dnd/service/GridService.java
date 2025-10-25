package com.dnd.service;

import com.dnd.config.MapConfiguration;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.io.File;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Service
public class GridService {
    private final Map<String, GridConfig> gridConfigs = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final MapConfiguration mapConfiguration;
    private final String GRID_CONFIG_DIR;

    @Autowired
    public GridService(MapConfiguration mapConfiguration) {
        this.mapConfiguration = mapConfiguration;
        this.GRID_CONFIG_DIR = mapConfiguration.getGridConfigs().getDirectory();

        // Utwórz katalog na konfiguracje siatki jeśli nie istnieje
        File dir = new File(GRID_CONFIG_DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    public static class GridConfig {
        private double gridSize;
        private double offsetX;
        private double offsetY;
        private double lineWidth = 1.0;
        private boolean calibrated;

        public GridConfig() {}

        public GridConfig(double gridSize, double offsetX, double offsetY) {
            this.gridSize = gridSize;
            this.offsetX = offsetX;
            this.offsetY = offsetY;
            this.calibrated = true;
        }

        public GridConfig(double gridSize, double offsetX, double offsetY, double lineWidth) {
            this.gridSize = gridSize;
            this.offsetX = offsetX;
            this.offsetY = offsetY;
            this.lineWidth = lineWidth;
            this.calibrated = true;
        }

        // Getters and setters
        public double getGridSize() { return gridSize; }
        public void setGridSize(double gridSize) { this.gridSize = gridSize; }

        public double getOffsetX() { return offsetX; }
        public void setOffsetX(double offsetX) { this.offsetX = offsetX; }

        public double getOffsetY() { return offsetY; }
        public void setOffsetY(double offsetY) { this.offsetY = offsetY; }

        public double getLineWidth() { return lineWidth; }
        public void setLineWidth(double lineWidth) { this.lineWidth = lineWidth; }

        public boolean isCalibrated() { return calibrated; }
        public void setCalibrated(boolean calibrated) { this.calibrated = calibrated; }
    }

    public GridConfig getGridConfig(String mapName) {
        // Spróbuj pobrać z cache
        GridConfig config = gridConfigs.get(mapName);
        if (config == null) {
            // Jeśli nie ma w cache, spróbuj wczytać z pliku
            config = loadGridConfigFromFile(mapName);
            if (config != null) {
                gridConfigs.put(mapName, config);
            }
        }
        return config;
    }

    public void setGridConfig(String mapName, double gridSize, double offsetX, double offsetY) {
        setGridConfig(mapName, gridSize, offsetX, offsetY, 1.0);
    }

    public void setGridConfig(String mapName, double gridSize, double offsetX, double offsetY, double lineWidth) {
        GridConfig config = new GridConfig(gridSize, offsetX, offsetY, lineWidth);
        gridConfigs.put(mapName, config);
        saveGridConfigToFile(mapName, config);
    }

    public void clearGridConfig(String mapName) {
        gridConfigs.remove(mapName);
        deleteGridConfigFile(mapName);
    }

    private void saveGridConfigToFile(String mapName, GridConfig config) {
        try {
            File file = new File(GRID_CONFIG_DIR, mapName + "_grid.json");
            objectMapper.writeValue(file, config);
        } catch (IOException e) {
            System.err.println("Błąd zapisywania konfiguracji siatki dla mapy " + mapName + ": " + e.getMessage());
        }
    }

    private GridConfig loadGridConfigFromFile(String mapName) {
        try {
            File file = new File(GRID_CONFIG_DIR, mapName + "_grid.json");
            if (file.exists()) {
                return objectMapper.readValue(file, GridConfig.class);
            }
        } catch (IOException e) {
            System.err.println("Błąd wczytywania konfiguracji siatki dla mapy " + mapName + ": " + e.getMessage());
        }
        return null;
    }

    private void deleteGridConfigFile(String mapName) {
        try {
            File file = new File(GRID_CONFIG_DIR, mapName + "_grid.json");
            if (file.exists()) {
                file.delete();
            }
        } catch (Exception e) {
            System.err.println("Błąd usuwania konfiguracji siatki dla mapy " + mapName + ": " + e.getMessage());
        }
    }
}
