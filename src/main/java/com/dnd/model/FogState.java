package com.dnd.model;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

public class FogState {
    private String mapName;
    private List<FogPoint> revealedAreas;

    public FogState() {}

    public FogState(String mapName, List<FogPoint> revealedAreas) {
        this.mapName = mapName;
        this.revealedAreas = revealedAreas;
    }

    public String getMapName() {
        return mapName;
    }

    public void setMapName(String mapName) {
        this.mapName = mapName;
    }

    public List<FogPoint> getRevealedAreas() {
        return revealedAreas;
    }

    public void setRevealedAreas(List<FogPoint> revealedAreas) {
        this.revealedAreas = revealedAreas;
    }

    public static class FogPoint {
        private int x;
        private int y;
        private int radius;
        @JsonProperty("isGridCell")
        private boolean isGridCell = false; // flaga kratki

        public FogPoint() {}

        public FogPoint(int x, int y, int radius) {
            this.x = x;
            this.y = y;
            this.radius = radius;
        }

        public FogPoint(int x, int y, int radius, boolean isGridCell) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.isGridCell = isGridCell;
        }

        public int getX() { return x; }
        public void setX(int x) { this.x = x; }
        public int getY() { return y; }
        public void setY(int y) { this.y = y; }
        public int getRadius() { return radius; }
        public void setRadius(int radius) { this.radius = radius; }

        @JsonProperty("isGridCell")
        public boolean isGridCell() { return isGridCell; }

        @JsonProperty("isGridCell")
        public void setGridCell(boolean gridCell) { isGridCell = gridCell; }
    }
}
