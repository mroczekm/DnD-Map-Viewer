package com.dnd.model;

public class MapSettings {
    private Double rotation;
    private Double zoom;
    private PanOffset panOffset;
    private String gridColor;
    private String fogColor;
    private Double fogOpacity;
    private String previewViewportColor;
    private Boolean previewViewportVisible;
    private Boolean gridVisible;

    public static class PanOffset {
        private double x;
        private double y;

        public PanOffset() {}

        public PanOffset(double x, double y) {
            this.x = x;
            this.y = y;
        }

        public double getX() { return x; }
        public void setX(double x) { this.x = x; }
        public double getY() { return y; }
        public void setY(double y) { this.y = y; }
    }

    // Getters and Setters
    public Double getRotation() { return rotation; }
    public void setRotation(Double rotation) { this.rotation = rotation; }

    public Double getZoom() { return zoom; }
    public void setZoom(Double zoom) { this.zoom = zoom; }

    public PanOffset getPanOffset() { return panOffset; }
    public void setPanOffset(PanOffset panOffset) { this.panOffset = panOffset; }

    public String getGridColor() { return gridColor; }
    public void setGridColor(String gridColor) { this.gridColor = gridColor; }

    public String getFogColor() { return fogColor; }
    public void setFogColor(String fogColor) { this.fogColor = fogColor; }

    public Double getFogOpacity() { return fogOpacity; }
    public void setFogOpacity(Double fogOpacity) { this.fogOpacity = fogOpacity; }

    public String getPreviewViewportColor() { return previewViewportColor; }
    public void setPreviewViewportColor(String previewViewportColor) {
        this.previewViewportColor = previewViewportColor;
    }

    public Boolean getPreviewViewportVisible() { return previewViewportVisible; }
    public void setPreviewViewportVisible(Boolean previewViewportVisible) {
        this.previewViewportVisible = previewViewportVisible;
    }

    public Boolean getGridVisible() { return gridVisible; }
    public void setGridVisible(Boolean gridVisible) { this.gridVisible = gridVisible; }
}

