package com.dnd.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app")
public class MapConfiguration {

    private Maps maps = new Maps();
    private FogStates fogStates = new FogStates();
    private GridConfigs gridConfigs = new GridConfigs();
    private Characters characters = new Characters();
    private Settings settings = new Settings();

    public Maps getMaps() {
        return maps;
    }

    public void setMaps(Maps maps) {
        this.maps = maps;
    }

    public FogStates getFogStates() {
        return fogStates;
    }

    public void setFogStates(FogStates fogStates) {
        this.fogStates = fogStates;
    }

    public GridConfigs getGridConfigs() {
        return gridConfigs;
    }

    public void setGridConfigs(GridConfigs gridConfigs) {
        this.gridConfigs = gridConfigs;
    }

    public Characters getCharacters() {
        return characters;
    }

    public void setCharacters(Characters characters) {
        this.characters = characters;
    }

    public Settings getSettings() {
        return settings;
    }

    public void setSettings(Settings settings) {
        this.settings = settings;
    }

    public static class Maps {
        private String directory;

        public String getDirectory() {
            return directory;
        }

        public void setDirectory(String directory) {
            this.directory = directory;
        }
    }

    public static class FogStates {
        private String directory;

        public String getDirectory() {
            return directory;
        }

        public void setDirectory(String directory) {
            this.directory = directory;
        }
    }

    public static class GridConfigs {
        private String directory = "grid-configs";

        public String getDirectory() {
            return directory;
        }

        public void setDirectory(String directory) {
            this.directory = directory;
        }
    }

    public static class Characters {
        private String directory = "characters";

        public String getDirectory() {
            return directory;
        }

        public void setDirectory(String directory) {
            this.directory = directory;
        }
    }

    public static class Settings {
        private String directory = "settings";

        public String getDirectory() {
            return directory;
        }

        public void setDirectory(String directory) {
            this.directory = directory;
        }
    }
}
