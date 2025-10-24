package com.dnd.controller;

import com.dnd.config.MapConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/map-files")
public class MapFileController {

    private final MapConfiguration mapConfiguration;

    @Autowired
    public MapFileController(MapConfiguration mapConfiguration) {
        this.mapConfiguration = mapConfiguration;
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> getMapFile(@PathVariable String filename) {
        try {
            Path mapsDir = Paths.get(mapConfiguration.getMaps().getDirectory());
            File file = new File(mapsDir.toFile(), filename);

            if (!file.exists() || !file.isFile()) {
                return ResponseEntity.notFound().build();
            }

            FileSystemResource resource = new FileSystemResource(file);

            // Określ typ zawartości na podstawie rozszerzenia pliku
            MediaType mediaType = MediaType.IMAGE_JPEG;
            String lowerFilename = filename.toLowerCase();
            if (lowerFilename.endsWith(".png")) {
                mediaType = MediaType.IMAGE_PNG;
            } else if (lowerFilename.endsWith(".gif")) {
                mediaType = MediaType.IMAGE_GIF;
            }

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
