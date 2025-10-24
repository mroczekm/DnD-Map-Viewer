package com.dnd.service;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class PreviewMapService {
    private final AtomicReference<String> previewMapName = new AtomicReference<>(null);
    private volatile boolean refreshRequested = false;
    private final AtomicReference<Map<String, String>> navigationCommand = new AtomicReference<>(new HashMap<>());
    private final AtomicReference<Map<String, Object>> viewport = new AtomicReference<>(new HashMap<>());

    public String getPreviewMapName() {
        return previewMapName.get();
    }

    public void setPreviewMapName(String mapName) {
        previewMapName.set(mapName);
    }

    public boolean isRefreshRequested() {
        return refreshRequested;
    }

    public void requestRefresh() {
        refreshRequested = true;
    }

    public void clearRefreshRequest() {
        refreshRequested = false;
    }

    public void setNavigationCommand(Map<String, String> command) {
        navigationCommand.set(command);
    }

    public Map<String, String> getNavigationCommand() {
        Map<String, String> command = navigationCommand.get();
        navigationCommand.set(new HashMap<>()); // Wyczyść po pobraniu
        return command;
    }

    public void setViewport(Map<String, Object> viewportData) {
        viewport.set(viewportData);
    }

    public Map<String, Object> getViewport() {
        return viewport.get();
    }
}
