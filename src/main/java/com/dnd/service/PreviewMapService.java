package com.dnd.service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class PreviewMapService {
    private final AtomicReference<String> previewMapName = new AtomicReference<>(null);
    private volatile boolean refreshRequested = false;
    private volatile boolean fogSaveInProgress = false; // Prosta blokada zapisu mgły
    private volatile boolean viewportFrameEnabled = false; // Kontrola ramki viewport
    private final AtomicReference<Map<String, String>> navigationCommand = new AtomicReference<>(new HashMap<>());
    private final AtomicReference<Map<String, Object>> viewport = new AtomicReference<>(new HashMap<>());

    @Autowired
    private MapSettingsService mapSettingsService;

    public String getPreviewMapName() {
        return previewMapName.get();
    }

    public void setPreviewMapName(String mapName) {
        previewMapName.set(mapName);
    }

    public boolean isRefreshRequested() {
        return refreshRequested;
    }

    // UPROSZCZONE - bez debounce ale z check blokady
    public void requestRefresh() {
        if (!fogSaveInProgress) {
            refreshRequested = true;
            System.out.println("🔄 Refresh request ustawiony");
        } else {
            System.out.println("⏸️ Refresh wstrzymany - trwa zapis mgły");
        }
    }

    public void clearRefreshRequest() {
        refreshRequested = false;
    }

    // Wymuszenie refresh (identyczne z requestRefresh teraz)
    public void forceRefresh() {
        refreshRequested = true;
        System.out.println("🚨 FORCE Refresh request ustawiony");
    }

    // Metody blokady zapisu mgły
    public void setFogSaveInProgress(boolean inProgress) {
        this.fogSaveInProgress = inProgress;
        if (inProgress) {
            System.out.println("🔒 Blokada odczytu - rozpoczęto zapis mgły");
        } else {
            System.out.println("🔓 Odblokowano odczyt - zakończono zapis mgły");
        }
    }

    public boolean isFogSaveInProgress() {
        return fogSaveInProgress;
    }

    // Kontrola ramki viewport
    public void enableViewportFrame() {
        viewportFrameEnabled = true;
        System.out.println("🔲 Ramka viewport WŁĄCZONA");
    }

    public void disableViewportFrame() {
        viewportFrameEnabled = false;
        System.out.println("🔲 Ramka viewport WYŁĄCZONA");
    }

    public boolean isViewportFrameEnabled() {
        return viewportFrameEnabled;
    }

    public void setNavigationCommand(Map<String, String> command) {
        System.out.println("📥 PreviewMapService otrzymał komendę nawigacji: " + command);
        navigationCommand.set(command);
    }

    public Map<String, String> getNavigationCommand() {
        Map<String, String> command = navigationCommand.get();
        if (!command.isEmpty()) {
            System.out.println("📤 PreviewMapService wysyła komendę nawigacji: " + command);
        }
        navigationCommand.set(new HashMap<>()); // Wyczyść po pobraniu
        return command;
    }

    public void setViewport(Map<String, Object> viewportData) {
        System.out.println("📥 PreviewMapService.setViewport() otrzymał dane:");
        System.out.println("   x: " + viewportData.get("x"));
        System.out.println("   y: " + viewportData.get("y"));
        System.out.println("   width: " + viewportData.get("width"));
        System.out.println("   height: " + viewportData.get("height"));
        System.out.println("   zoom: " + viewportData.get("zoom"));
        System.out.println("   rotation: " + viewportData.get("rotation"));

        viewport.set(viewportData);

        System.out.println("📤 PreviewMapService.setViewport() zapisał dane do viewport");

        // Automatyczna synchronizacja ustawień mapy z viewport-em
        if (viewportData != null && previewMapName.get() != null) {
            try {
                // Zaktualizuj ustawienia mapy zgodnie z viewport-em
                String mapName = previewMapName.get();

                // Pobierz obecne ustawienia
                com.dnd.model.MapSettings currentSettings = mapSettingsService.loadMapSettings(mapName);
                if (currentSettings == null) {
                    currentSettings = new com.dnd.model.MapSettings();
                }

                // Aktualizuj z viewport-em
                if (viewportData.containsKey("zoom")) {
                    currentSettings.setZoom(((Number) viewportData.get("zoom")).doubleValue());
                }

                if (viewportData.containsKey("panX") || viewportData.containsKey("panY")) {
                    com.dnd.model.MapSettings.PanOffset panOffset = currentSettings.getPanOffset();
                    if (panOffset == null) {
                        panOffset = new com.dnd.model.MapSettings.PanOffset();
                    }

                    if (viewportData.containsKey("panX")) {
                        panOffset.setX(((Number) viewportData.get("panX")).doubleValue());
                    }
                    if (viewportData.containsKey("panY")) {
                        panOffset.setY(((Number) viewportData.get("panY")).doubleValue());
                    }

                    currentSettings.setPanOffset(panOffset);
                }

                if (viewportData.containsKey("rotation")) {
                    double rotation = ((Number) viewportData.get("rotation")).doubleValue();
                    currentSettings.setRotation(rotation);
                    System.out.println("🔄 Synchronizacja obrotu mapy: " + rotation + "°");
                }

                // Zapisz zaktualizowane ustawienia
                mapSettingsService.saveMapSettings(mapName, currentSettings);

            } catch (Exception e) {
                System.err.println("❌ Błąd synchronizacji ustawień mapy z viewport: " + e.getMessage());
            }
        }
    }

    public Map<String, Object> getViewport() {
        Map<String, Object> result = viewport.get();
        System.out.println("📤 PreviewMapService.getViewport() zwraca dane:");
        if (result != null) {
            System.out.println("   x: " + result.get("x"));
            System.out.println("   y: " + result.get("y"));
            System.out.println("   width: " + result.get("width"));
            System.out.println("   height: " + result.get("height"));
        } else {
            System.out.println("   null (brak danych viewport)");
        }
        return result;
    }
}
