# Podsumowanie zmian - Auto-save i Docker

## ✅ Zrealizowane funkcje

### 1. Automatyczny zapis co 30 sekund
- ✅ Wszystkie ustawienia zapisywane do plików (nie localStorage)
- ✅ Mgła
- ✅ Siatka  
- ✅ Postacie
- ✅ Zoom, pan, rotacja
- ✅ Kolory i przezroczystość
- ✅ Widoczność elementów

### 2. Struktura katalogów dla Docker
- ✅ JEDEN katalog `./data` dla wszystkich danych
- ✅ Łatwe mapowanie w docker-compose.yml
- ✅ Prosty backup: `tar -czf backup.tar.gz ./data`

### 3. Pliki utworzone

#### Backend
- ✅ `MapSettings.java` - model danych ustawień
- ✅ `MapSettingsService.java` - serwis zapisu/odczytu
- ✅ `MapSettingsController.java` - REST API
- ✅ Zaktualizowano `MapConfiguration.java` - dodano characters i settings
- ✅ Zaktualizowano `CharacterService.java` - używa konfiguracji
- ✅ Zaktualizowano `MapService.java` - używa konfiguracji

#### Frontend
- ✅ Dodano `startAutoSave()` - uruchamia auto-save co 30s
- ✅ Dodano `autoSaveAllSettings()` - zapisuje wszystko
- ✅ Zmieniono `saveMapSettings()` - zapisuje do backendu (async)
- ✅ Zmieniono `loadMapSettings()` - wczytuje z backendu (async)

#### Docker
- ✅ `Dockerfile` - multi-stage build z Alpine
- ✅ `docker-compose.yml` - jeden katalog ./data
- ✅ `.dockerignore` - optymalizacja buildu
- ✅ `DOCKER.md` - pełna dokumentacja

#### Narzędzia
- ✅ `init-data.bat` / `init-data.sh` - inicjalizacja katalogów
- ✅ `migrate-to-data.bat` - migracja istniejących danych

#### Konfiguracja
- ✅ `application.properties` - zmienne środowiskowe z fallbackiem

## 📂 Struktura danych

```
./data/                         # JEDEN katalog - łatwo zmapować!
├── DnD/                        # Obrazy map
├── fog-states/                 # Stany mgły (auto-save 30s)
├── grid-configs/               # Siatki (auto-save 30s)
├── characters/                 # Postacie (auto-save 30s)
└── settings/                   # Ustawienia (auto-save 30s)
```

## 🚀 Jak uruchomić

### Lokalnie (Windows)
```bash
# 1. Inicjalizuj katalogi
init-data.bat

# 2. Uruchom aplikację
mvnw.cmd spring-boot:run
```

### Docker
```bash
# 1. Zbuduj i uruchom
docker-compose up -d

# 2. Otwórz
# GM: http://localhost:8080/gm
# Gracze: http://localhost:8080/view
```

## 💾 Backup i Restore

### Backup
```bash
tar -czf backup-$(date +%Y%m%d).tar.gz ./data
```

### Restore
```bash
tar -xzf backup-20241026.tar.gz
docker-compose restart
```

## 🔄 Migracja istniejących danych

```bash
# Windows
migrate-to-data.bat

# Linux/Mac
mkdir -p data/{DnD,fog-states,grid-configs,characters,settings}
cp -r DnD/* data/DnD/
cp -r fog-states/* data/fog-states/
# itd...
```

## 🎯 Zmienne środowiskowe

Definiowane w `docker-compose.yml`:

```yaml
DND_MAPS_DIR=/app/data/DnD
DND_FOG_DIR=/app/data/fog-states
DND_GRID_DIR=/app/data/grid-configs
DND_CHARACTERS_DIR=/app/data/characters
DND_SETTINGS_DIR=/app/data/settings
```

Można zmienić jeśli potrzeba innej struktury.

## ⚙️ API Endpointy

### Ustawienia mapy
- `POST /api/map-settings/{mapName}` - zapisz ustawienia
- `GET /api/map-settings/{mapName}` - wczytaj ustawienia
- `DELETE /api/map-settings/{mapName}` - usuń ustawienia

### Istniejące (bez zmian)
- `/api/maps` - lista map
- `/api/fog/{mapName}` - mgła
- `/api/grid/{mapName}` - siatka
- `/api/characters/{mapName}` - postacie

## 🐛 Naprawione błędy

- ✅ Krańcowe kolumny/rzędy siatki - dodano tolerancję 5px
- ✅ Ramka podglądu - zsynchronizowana logika transformacji
- ✅ Obrót mapy - poprawione obliczenia getMousePos()
- ✅ Rotacja literek wrogów:
  - Literki ZAWSZE czytelne (obracają się przeciwnie do mapy)
  - Dodano przerysowywanie w updateTransform() na podglądzie
  - Działa zarówno na adminie jak i podglądzie

## 📋 TODO (opcjonalne)

- [ ] Dodać UI do zarządzania backupami
- [ ] Dodać eksport/import pojedynczych map
- [ ] Dodać autoryzację (basic auth)
- [ ] Dodać logi aktywności
- [ ] Dodać websockets dla real-time sync

## 🎉 Gotowe do użycia!

Wszystko działa, dane są bezpieczne w plikach, łatwe do backupu i Dockera!

