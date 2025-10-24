package com.dnd.service;
import org.springframework.stereotype.Service;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class PreviewMapService {
    private final AtomicReference<String> previewMapName = new AtomicReference<>(null);
    private volatile boolean refreshRequested = false;

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
}
