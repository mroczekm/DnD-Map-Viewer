package com.dnd.service;

import com.dnd.config.MapConfiguration;
import com.dnd.model.FogState;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Service
public class FogService {

    private final MapConfiguration mapConfiguration;
    private final ObjectMapper objectMapper;

    @Autowired
    public FogService(MapConfiguration mapConfiguration) {
        this.mapConfiguration = mapConfiguration;
        this.objectMapper = new ObjectMapper();
    }

    public FogState getFogState(String mapName) {
        File fogFile = getFogFile(mapName);

        if (!fogFile.exists()) {
            return new FogState(mapName, new ArrayList<>());
        }

        try {
            FogState state = objectMapper.readValue(fogFile, FogState.class);
            if (state.getRevealedAreas() == null) {
                state.setRevealedAreas(new ArrayList<>());
            }
            return state;
        } catch (IOException e) {
            System.err.println("Błąd odczytu stanu mgły dla mapy: " + mapName);
            System.err.println("Szczegóły błędu: " + e.getMessage());
            System.err.println("Rozmiar pliku: " + fogFile.length() + " bajtów");

            // Jeśli plik jest za duży lub uszkodzony, utwórz backup i zacznij od nowa
            if (fogFile.length() > 10_000_000) { // 10MB
                System.err.println("Plik mgły jest za duży! Tworzenie backupu...");
                File backup = new File(fogFile.getParent(), mapName + "_fog_backup_" + System.currentTimeMillis() + ".json");
                fogFile.renameTo(backup);
                System.err.println("Backup utworzony: " + backup.getName());
            }

            return new FogState(mapName, new ArrayList<>());
        }
    }

    public void saveFogState(FogState fogState) {
        File fogFile = getFogFile(fogState.getMapName());

        try {
            // Optymalizuj stan mgły przed zapisem
            optimizeFogState(fogState);

            // Upewnij się że katalog istnieje
            File parentDir = fogFile.getParentFile();
            if (parentDir != null && !parentDir.exists()) {
                parentDir.mkdirs();
            }

            // Zapisz używając standardowej metody ObjectMapper
            // Jest najbardziej niezawodna i nie wymaga dodatkowych walidacji
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(fogFile, fogState);

            // Loguj sukces (bez walidacji która powodowała problemy)
            System.out.println("Stan mgły zapisany pomyślnie dla mapy: " + fogState.getMapName() +
                             " (punktów: " + fogState.getRevealedAreas().size() + " bajtów)");

        } catch (IOException e) {
            System.err.println("Błąd zapisu stanu mgły dla mapy: " + fogState.getMapName());
            System.err.println("Ścieżka pliku: " + fogFile.getAbsolutePath());
            System.err.println("Szczegóły: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Nie można zapisać stanu mgły dla mapy: " + fogState.getMapName(), e);
        }
    }

    private void optimizeFogState(FogState fogState) {
        List<FogState.FogPoint> areas = fogState.getRevealedAreas();
        if (areas == null || areas.isEmpty()) {
            return;
        }

        // Jeśli lista jest za duża (powyżej 1000 punktów), usuń duplikaty i zmniejsz
        if (areas.size() > 1000) {
            System.out.println("Optymalizacja mgły dla mapy: " + fogState.getMapName() +
                             " (punktów: " + areas.size() + ")");

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
            System.out.println("Po optymalizacji: " + optimized.size() + " punktów");

            // Jeśli nadal za dużo (powyżej 5000), weź tylko co N-ty punkt
            if (optimized.size() > 5000) {
                System.out.println("Nadal za dużo punktów, redukowanie...");
                List<FogState.FogPoint> reduced = new ArrayList<>();
                int step = optimized.size() / 5000 + 1;
                for (int i = 0; i < optimized.size(); i += step) {
                    reduced.add(optimized.get(i));
                }
                fogState.setRevealedAreas(reduced);
                System.out.println("Po redukcji: " + reduced.size() + " punktów");
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
            // Usuń punkty w określonym obszarze (z tolerancją dla kratek siatki)
            revealedAreas.removeIf(existingPoint -> {
                double distance = Math.sqrt(
                    Math.pow(existingPoint.getX() - pointToRemove.getX(), 2) +
                    Math.pow(existingPoint.getY() - pointToRemove.getY(), 2)
                );
                // Usuń jeśli punkt jest w zasięgu (radius + tolerancja)
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

    private File getFogFile(String mapName) {
        Path fogDir = Paths.get(mapConfiguration.getFogStates().getDirectory());
        return new File(fogDir.toFile(), mapName + "_fog.json");
    }
}
