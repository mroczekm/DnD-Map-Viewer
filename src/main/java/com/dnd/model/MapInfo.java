package com.dnd.model;

public class MapInfo {
    private String name;
    private String filename;
    private int width;
    private int height;

    public MapInfo() {}

    public MapInfo(String name, String filename, int width, int height) {
        this.name = name;
        this.filename = filename;
        this.width = width;
        this.height = height;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public int getWidth() {
        return width;
    }

    public void setWidth(int width) {
        this.width = width;
    }

    public int getHeight() {
        return height;
    }

    public void setHeight(int height) {
        this.height = height;
    }
}
