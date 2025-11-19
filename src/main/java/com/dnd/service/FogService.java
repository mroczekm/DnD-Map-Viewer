package com.dnd.service;

import com.dnd.model.FogState;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class FogService {

    private final MapDataService mapDataService;
    private final PreviewMapService previewMapService;

    @Autowired
    public FogService(MapDataService mapDataService, PreviewMapService previewMapService) {
        this.mapDataService = mapDataService;
        this.previewMapService = previewMapService;
    }

    public FogState getFogState(String mapName) {
        try {
            Map<String, Object> mapData = mapDataService.getMapData(mapName);

            if (mapData == null) {
                return new FogState(mapName, new ArrayList<>());
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> fogSection = (Map<String, Object>) mapData.get("fog");

            if (fogSection == null) {
                return new FogState(mapName, new ArrayList<>());
            }

            // Konwertuj dane mgły na FogState
            String fogMapName = (String) fogSection.get("mapName");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> areasData = (List<Map<String, Object>>) fogSection.get("revealedAreas");


            List<FogState.FogPoint> revealedAreas = new ArrayList<>();
            if (areasData != null) {
                for (Map<String, Object> areaData : areasData) {
                    try {
                        int x = ((Number) areaData.get("x")).intValue();
                        int y = ((Number) areaData.get("y")).intValue();
                        int radius = ((Number) areaData.get("radius")).intValue();
                        boolean isGridCell = Boolean.TRUE.equals(areaData.get("isGridCell"));

                        revealedAreas.add(new FogState.FogPoint(x, y, radius, isGridCell));
                    } catch (Exception pointError) {
                        // Ignoruj uszkodzone punkty mgły
                        System.err.println("⚠️ Ignoruję uszkodzony punkt mgły: " + pointError.getMessage());
                    }
                }
            }

            FogState result = new FogState(fogMapName != null ? fogMapName : mapName, revealedAreas);
            return result;

        } catch (Exception e) {
            System.err.println("BŁĄD odczytu stanu mgły dla mapy: " + mapName);
            System.err.println("Szczegóły błędu: " + e.getMessage());

            // ZAWSZE zwróć jakąkolwiek mgłę - nie null
            return new FogState(mapName, new ArrayList<>());
        }
    }

    public synchronized void saveFogState(FogState fogState) {
        long startTime = System.currentTimeMillis();
        String mapName = fogState.getMapName();
        int areaCount = fogState.getRevealedAreas().size();


        try {
            // Optymalizuj stan mgły przed zapisem
            optimizeFogState(fogState);

            // Pobierz istniejące dane mapy - DEFENSYWNIE
            Map<String, Object> mapData = null;
            try {
                mapData = mapDataService.getMapData(mapName);
                System.out.println("📖 Odczytano mapData w saveFogState, klucze: " + (mapData != null ? mapData.keySet() : "null"));
            } catch (Exception e) {
                System.err.println("⚠️ Błąd odczytu pliku podczas zapisu mgły: " + e.getMessage());
                // Kontynuuj z mapData = null - zostanie utworzona podstawowa struktura
            }

            if (mapData == null) {
                // Plik nie istnieje lub jest uszkodzony - stwórz MINIMALNĄ strukturę
                mapData = new HashMap<>();

                // Utwórz tylko PODSTAWOWĄ strukturę - bez nadpisywania zaawansowanych ustawień
                Map<String, Object> settings = new HashMap<>();
                settings.put("zoom", 1);
                settings.put("panX", 0);
                settings.put("panY", 0);
                settings.put("rotation", 0);
                settings.put("previewZoom", 100);
                mapData.put("settings", settings);

                Map<String, Object> grid = new HashMap<>();
                grid.put("size", null);
                grid.put("offsetX", 0);
                grid.put("offsetY", 0);
                grid.put("visible", false);
                mapData.put("grid", grid);

                Map<String, Object> characters = new HashMap<>();
                characters.put("players", new ArrayList<>());
                characters.put("enemies", new ArrayList<>());
                characters.put("enemyLetterCounter", 0);
                mapData.put("characters", characters);

                mapData.put("timestamp", java.time.Instant.now().toString());
                mapData.put("version", "1.0");
            }

            // Zaktualizuj sekcję mgły
            Map<String, Object> fogSection = new HashMap<>();
            fogSection.put("mapName", fogState.getMapName());

            List<Map<String, Object>> areasData = new ArrayList<>();
            for (FogState.FogPoint point : fogState.getRevealedAreas()) {
                Map<String, Object> areaData = new HashMap<>();
                areaData.put("x", point.getX());
                areaData.put("y", point.getY());
                areaData.put("radius", point.getRadius());
                areaData.put("isGridCell", point.isGridCell());
                areasData.add(areaData);
            }
            fogSection.put("revealedAreas", areasData);

            mapData.put("fog", fogSection);

            // Zaktualizuj timestamp
            mapData.put("timestamp", java.time.Instant.now().toString());

            // PROSTY zapis do unified system
            try {
                mapDataService.saveMapData(mapName, mapData);
            } catch (IOException saveEx) {
                System.err.println("Błąd zapisu pliku danych dla mapy: " + mapName);
                System.err.println("Błąd I/O: " + saveEx.getMessage());
                // Po prostu loguj błąd - podgląd odświeży mgłę ręcznie przyciskiem
            }

        } catch (Exception e) {
            System.err.println("Błąd zapisu stanu mgły dla mapy: " + fogState.getMapName());
            System.err.println("Szczegóły: " + e.getMessage());
            e.printStackTrace();

        } finally {
            long duration = System.currentTimeMillis() - startTime;
        }
    }

    // New method for controller compatibility
    public void saveFogState(String mapName, FogState fogState) {
        // Ensure the map name is set
        fogState.setMapName(mapName);
        saveFogState(fogState);
    }

    public String getFogStateHash(String mapName) {
        try {
            FogState fogState = getFogState(mapName);
            if (fogState == null || fogState.getRevealedAreas() == null) {
                return "";
            }

            // Create a simple hash based on the number of revealed areas and their coordinates
            StringBuilder hashBuilder = new StringBuilder();
            hashBuilder.append("areas:").append(fogState.getRevealedAreas().size());

            // Add sum of coordinates for basic change detection
            long coordSum = fogState.getRevealedAreas().stream()
                .mapToLong(area -> area.getX() + area.getY() + area.getRadius())
                .sum();
            hashBuilder.append(":sum:").append(coordSum);

            return String.valueOf(hashBuilder.toString().hashCode());
        } catch (Exception e) {
            return "";
        }
    }

    private void optimizeFogState(FogState fogState) {
        List<FogState.FogPoint> areas = fogState.getRevealedAreas();
        if (areas == null || areas.isEmpty()) {
            return;
        }

        // Jeśli lista jest za duża (powyżej 1000 punktów), usuń duplikaty i zmniejsz
        if (areas.size() > 1000) {
            // Usuń duplikaty - punkty w bardzo podobnej lokalizacji
            List<FogState.FogPoint> optimized = new ArrayList<>();
            for (FogState.FogPoint point : areas) {
                boolean isDuplicate = optimized.stream().anyMatch(p ->
                    Math.abs(p.getX() - point.getX()) < 3 &&
                    Math.abs(p.getY() - point.getY()) < 3 &&
                    Math.abs(p.getRadius() - point.getRadius()) < 3
                );
                if (!isDuplicate) {
                    optimized.add(point);
                }
            }

            fogState.setRevealedAreas(optimized);

            // Jeśli nadal za dużo (powyżej 5000), weź tylko co N-ty punkt
            if (optimized.size() > 5000) {
                List<FogState.FogPoint> reduced = new ArrayList<>();
                int step = optimized.size() / 5000 + 1;
                for (int i = 0; i < optimized.size(); i += step) {
                    reduced.add(optimized.get(i));
                }
                fogState.setRevealedAreas(reduced);
            }
        }
    }

    public void addRevealedArea(String mapName, int x, int y, int radius) {
        FogState fogState = getFogState(mapName);
        List<FogState.FogPoint> revealedAreas = fogState.getRevealedAreas();

        if (revealedAreas == null) {
            revealedAreas = new ArrayList<>();
            fogState.setRevealedAreas(revealedAreas);
        }

        revealedAreas.add(new FogState.FogPoint(x, y, radius, false));
        saveFogState(fogState);
    }

    public void addRevealedAreas(String mapName, List<com.dnd.controller.FogController.FogPoint> points) {
        FogState fogState = getFogState(mapName);

        for (com.dnd.controller.FogController.FogPoint point : points) {
            fogState.getRevealedAreas().add(new FogState.FogPoint(point.getX(), point.getY(), point.getRadius(), point.isGridCell()));
        }

        saveFogState(fogState);
    }

    public void removeRevealedAreas(String mapName, List<com.dnd.controller.FogController.FogPoint> points) {
        FogState fogState = getFogState(mapName);
        List<FogState.FogPoint> revealedAreas = fogState.getRevealedAreas();

        for (com.dnd.controller.FogController.FogPoint pointToRemove : points) {
            revealedAreas.removeIf(existingPoint -> {
                double distance = Math.sqrt(
                    Math.pow(existingPoint.getX() - pointToRemove.getX(), 2) +
                    Math.pow(existingPoint.getY() - pointToRemove.getY(), 2)
                );
                return distance <= (pointToRemove.getRadius() + 10);
            });
        }

        saveFogState(fogState);
    }

    // Stara metoda kompatybilności (bez flagi)
    public void revealFogPoint(String mapName, int x, int y, int radius) {
        revealFogPoint(mapName, x, y, radius, false);
    }

    // Nowa metoda z flagą informującą o kratce siatki
    public void revealFogPoint(String mapName, int x, int y, int radius, boolean isGridCell) {
        FogState fogState = getFogState(mapName);
        fogState.getRevealedAreas().add(new FogState.FogPoint(x, y, radius, isGridCell));
        saveFogState(fogState);
    }

    public void resetFog(String mapName) {
        FogState fogState = new FogState(mapName, new ArrayList<>());
        saveFogState(fogState);
    }


}
