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
            return new FogState(mapName, new ArrayList<>());
        }
    }

    public void saveFogState(FogState fogState) {
        File fogFile = getFogFile(fogState.getMapName());

        try {
            objectMapper.writeValue(fogFile, fogState);
        } catch (IOException e) {
            throw new RuntimeException("Nie można zapisać stanu mgły dla mapy: " + fogState.getMapName(), e);
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
