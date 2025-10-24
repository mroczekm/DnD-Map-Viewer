package com.dnd.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app")
public class MapConfiguration {

    private Maps maps = new Maps();
    private FogStates fogStates = new FogStates();

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
}
