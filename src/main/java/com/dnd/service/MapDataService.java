package com.dnd.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.nio.file.*;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
public class MapDataService {

    private final ObjectMapper objectMapper;
    private static final String DATA_DIR = "data";

    public MapDataService() {
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Zapisz wszystkie dane mapy do pliku JSON - PROSTY ZAPIS Z RETRY
     */
    public synchronized void saveMapData(String mapName, Map<String, Object> mapData) throws IOException {
        System.out.println("🔒 SYNCHRONIZED saveMapData START dla: " + mapName);
        Path dataDir = Paths.get(DATA_DIR);
        if (!Files.exists(dataDir)) {
            Files.createDirectories(dataDir);
        }

        Path filePath = dataDir.resolve(mapName + "_data.json");
        String jsonData = objectMapper.writeValueAsString(mapData);

        // DIAGNOSTYKA - sprawdź co jest zapisywane
        if (mapData.containsKey("fog")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> fogSection = (Map<String, Object>) mapData.get("fog");
            if (fogSection != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> areas = (List<Map<String, Object>>) fogSection.get("revealedAreas");
                System.out.println("🔍 PRZED ZAPISEM - sekcja fog zawiera: " + (areas != null ? areas.size() : "null") + " obszarów");

                // Sprawdź czy JSON zawiera mgłę
                if (jsonData.contains("\"fog\"") && jsonData.contains("revealedAreas")) {
                    System.out.println("✅ JSON zawiera sekcję fog z revealedAreas");
                } else {
                    System.out.println("❌ JSON NIE zawiera poprawnej sekcji fog!");
                    System.out.println("   JSON fragment: " + jsonData.substring(0, Math.min(200, jsonData.length())));
                }
            } else {
                System.out.println("❌ PRZED ZAPISEM - sekcja fog jest null!");
            }
        } else {
            System.out.println("❌ PRZED ZAPISEM - brak sekcji 'fog' w mapData!");
            System.out.println("   Klucze w mapData: " + mapData.keySet());
            return;
        }

        // PROSTY ZAPIS Z RETRY - unikaj skomplikowanych operacji atomic
        IOException lastException = null;
        boolean writeSuccessful = false;

        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                // Bezpośredni zapis do pliku
                Files.write(filePath, jsonData.getBytes(),
                    StandardOpenOption.CREATE,
                    StandardOpenOption.TRUNCATE_EXISTING,
                    StandardOpenOption.WRITE);

                // Weryfikuj że plik został zapisany poprawnie
                if (Files.exists(filePath) && Files.size(filePath) > 0) {
                    writeSuccessful = true;
                    System.out.println("💾 Zapis zakończony dla: " + mapName + " (" + jsonData.length() + " bajtów)");

                    // WERYFIKACJA: Sprawdź co faktycznie zostało zapisane
                    try {
                        String writtenData = Files.readString(filePath);
                        if (writtenData.contains("\"fog\"") && writtenData.contains("revealedAreas")) {
                            System.out.println("✅ WERYFIKACJA: Plik zawiera sekcję fog");
                        } else {
                            System.out.println("❌ WERYFIKACJA: Plik NIE zawiera sekcji fog!");
                            System.out.println("   Zapisane dane (pierwsze 200 znaków): " + writtenData.substring(0, Math.min(200, writtenData.length())));
                        }
                    } catch (Exception verifyEx) {
                        System.err.println("❌ Błąd weryfikacji zapisu: " + verifyEx.getMessage());
                    }

                    break;
                } else {
                    throw new IOException("Plik został utworzony ale jest pusty");
                }

            } catch (IOException writeEx) {
                lastException = writeEx;
                System.err.println("⚠️ Próba " + attempt + " zapisu nie powiodła się: " + writeEx.getMessage());

                if (attempt < 3) {
                    try {
                        // Wymuś garbage collection przed retry
                        System.gc();
                        Thread.sleep(100 * attempt); // Zwiększaj delay: 100ms, 200ms, 300ms
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }

        if (!writeSuccessful) {
            throw new IOException("Nie udało się zapisać pliku po 3 próbach. Ostatni błąd: " +
                (lastException != null ? lastException.getMessage() : "nieznany"));
        }

        System.out.println("🔓 SYNCHRONIZED saveMapData END dla: " + mapName);
    }

    /**
     * Załaduj wszystkie dane mapy z pliku JSON - z retry przy błędach blokady
     */
    @SuppressWarnings("unchecked")
    public synchronized Map<String, Object> getMapData(String mapName) throws IOException {
        System.out.println("🔒 SYNCHRONIZED getMapData dla: " + mapName);
        Path filePath = Paths.get(DATA_DIR, mapName + "_data.json");

        if (!Files.exists(filePath)) {
            return null;
        }

        // Retry mechanism dla odczytu (może być zablokowany przez zapis)
        String jsonData = null;
        Exception lastException = null;

        for (int retry = 0; retry < 3; retry++) {
            try {
                jsonData = Files.readString(filePath);
                break; // Sukces - wyjdź z pętli

            } catch (IOException readEx) {
                lastException = readEx;
                System.err.println("⚠️ Próba " + (retry + 1) + " odczytu pliku nie powiodła się: " + readEx.getMessage());

                if (retry < 2) {
                    try {
                        Thread.sleep(25); // 25ms delay przed retry
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }

        if (jsonData == null) {
            throw new IOException("Nie udało się odczytać pliku po 3 próbach: " +
                (lastException != null ? lastException.getMessage() : "unknown error"));
        }

        // Sprawdź czy plik nie jest pusty lub zawiera tylko białe znaki
        if (jsonData.trim().isEmpty()) {
            System.err.println("Plik danych mapy " + mapName + " jest pusty. Usuwam uszkodzony plik.");
            Files.delete(filePath);
            return null;
        }

        try {
            Map<String, Object> mapData = objectMapper.readValue(jsonData, Map.class);

            // DIAGNOSTYKA - sprawdź co zostało odczytane
            if (mapData.containsKey("fog")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> fogSection = (Map<String, Object>) mapData.get("fog");
                if (fogSection != null) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> areas = (List<Map<String, Object>>) fogSection.get("revealedAreas");
                    System.out.println("🔍 ODCZYTANO Z PLIKU - sekcja fog zawiera: " + (areas != null ? areas.size() : "null") + " obszarów");

                    // Sprawdź surowy JSON
                    if (jsonData.contains("\"fog\"") && jsonData.contains("revealedAreas")) {
                        System.out.println("✅ Surowy JSON zawiera sekcję fog");
                        // Znajdź i pokaż sekcję fog w JSON
                        int fogStart = jsonData.indexOf("\"fog\"");
                        if (fogStart >= 0) {
                            int fogEnd = jsonData.indexOf("}", fogStart) + 1;
                            String fogJson = jsonData.substring(fogStart, Math.min(fogEnd + 100, jsonData.length()));
                            System.out.println("   Sekcja fog: " + fogJson);
                        }
                    } else {
                        System.out.println("❌ Surowy JSON NIE zawiera sekcji fog!");
                    }
                } else {
                    System.out.println("❌ ODCZYTANO - sekcja fog jest null mimo że klucz istnieje!");
                }
            } else {
                System.out.println("❌ ODCZYTANO - brak klucza 'fog' w mapData!");
                System.out.println("   Klucze w odczytanym mapData: " + mapData.keySet());
                System.out.println("   Rozmiar pliku: " + jsonData.length() + " znaków");

                // Sprawdź czy JSON zawiera fog mimo że nie został sparsowany
                if (jsonData.contains("\"fog\"")) {
                    System.out.println("⚠️ JSON zawiera 'fog' ale nie został sparsowany do mapData!");
                }
            }

            return mapData;
        } catch (Exception e) {
            System.err.println("Błąd parsowania pliku danych mapy " + mapName + ": " + e.getMessage());
            System.err.println("Rozmiar pliku: " + Files.size(filePath) + " bajtów");
            System.err.println("Zawartość pliku: " + jsonData.substring(0, Math.min(100, jsonData.length())));

            // Utwórz backup uszkodzonego pliku
            Path backupPath = Paths.get(DATA_DIR, mapName + "_data_backup_" + System.currentTimeMillis() + ".json");
            try {
                Files.move(filePath, backupPath);
                System.err.println("Uszkodzony plik został przeniesiony do: " + backupPath.getFileName());
            } catch (IOException backupEx) {
                System.err.println("Nie udało się utworzyć backup: " + backupEx.getMessage());
            }

            return null;
        }

    }

    /**
     * Usuń plik danych mapy
     */
    public boolean deleteMapData(String mapName) throws IOException {
        Path filePath = Paths.get(DATA_DIR, mapName + "_data.json");

        if (Files.exists(filePath)) {
            Files.delete(filePath);
            return true;
        }

        return false;
    }
}
