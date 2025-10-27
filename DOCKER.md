# DnD Map Viewer - Instrukcje Dockera

## Szybki start z Dockerem

### 1. Zbuduj i uruchom

```bash
docker-compose up -d
```

### 2. Otwórz aplikację

- **Admin (GM)**: http://localhost:8080/gm
- **Podgląd dla graczy**: http://localhost:8080/view

### 3. Dodaj swoją pierwszą mapę

1. Kliknij "Dodaj mapę" w interfejsie
2. Wybierz nazwę i obraz
3. Skonfiguruj siatkę
4. Gotowe!

## Struktura danych (JEDEN katalog ./data)

Wszystkie dane znajdują się w **jednym** katalogu `./data`:

```
./data/
├── DnD/              # Obrazy map (*.jpg, *.png)
│   ├── Zamek.jpg
│   └── Test.jpg
├── fog-states/       # Stany mgły (auto-save co 30s)
│   ├── Zamek_fog.json
│   └── Test_fog.json
├── grid-configs/     # Konfiguracje siatki (auto-save co 30s)
│   ├── Zamek_grid.json
│   └── Test_grid.json
├── characters/       # Postacie (auto-save co 30s)
│   ├── Zamek_characters.json
│   └── Test_characters.json
└── settings/         # Ustawienia (auto-save co 30s)
    ├── Zamek_settings.json
    └── Test_settings.json
```

## Backup i Restore

### Backup (jeden plik ze wszystkimi danymi)

```bash
tar -czf dnd-backup-$(date +%Y%m%d).tar.gz ./data
```

### Restore

```bash
tar -xzf dnd-backup-YYYYMMDD.tar.gz
docker-compose restart
```

## Migracja istniejących danych

Jeśli masz już mapy w różnych katalogach, przenieś je do struktury `./data`:

```bash
mkdir -p ./data/DnD ./data/fog-states ./data/grid-configs ./data/characters ./data/settings
mv DnD/* ./data/DnD/
mv fog-states/* ./data/fog-states/
mv grid-configs/* ./data/grid-configs/
mv characters/* ./data/characters/
mv settings/* ./data/settings/
```

## Zarządzanie kontenerem

```bash
# Uruchom
docker-compose up -d

# Zatrzymaj
docker-compose down

# Logi
docker-compose logs -f

# Restart
docker-compose restart

# Rebuild po zmianach
docker-compose up -d --build
```

## Zmienne środowiskowe

Domyślne ścieżki (można zmienić w docker-compose.yml):

```yaml
DND_MAPS_DIR=/app/data/DnD
DND_FOG_DIR=/app/data/fog-states
DND_GRID_DIR=/app/data/grid-configs
DND_CHARACTERS_DIR=/app/data/characters
DND_SETTINGS_DIR=/app/data/settings
```

## Automatyczny zapis

✅ Wszystkie ustawienia są automatycznie zapisywane **co 30 sekund**:
- Stan mgły
- Pozycje postaci (gracze i wrogowie)
- Zoom, pan, rotacja mapy
- Kolory i przezroczystość
- Widoczność elementów
- Konfiguracja siatki

## Uruchomienie bez Dockera (lokalnie)

```bash
./mvnw spring-boot:run
```

Dane będą w lokalnych katalogach:
- `./DnD/`
- `./fog-states/`
- `./grid-configs/`
- `./characters/`
- `./settings/`

## Porty

- **8080**: Główna aplikacja (admin + podgląd)

## Rozwiązywanie problemów

### Kontener się nie uruchamia

```bash
# Sprawdź logi
docker-compose logs

# Sprawdź czy katalog ./data istnieje
ls -la ./data
```

### Brak uprawnień do katalogów

```bash
# Na Linuxie/Mac
chmod -R 777 ./data

# Lub zmień właściciela
chown -R $(id -u):$(id -g) ./data
```

### Reset całej aplikacji

```bash
docker-compose down
rm -rf ./data
docker-compose up -d
```

## Bezpieczeństwo

⚠️ **UWAGA**: Ta aplikacja NIE ma autoryzacji!
- Nie wystawiaj na internet bez dodatkowej ochrony (VPN, reverse proxy z auth)
- Używaj tylko w zaufanej sieci lokalnej
- Dla publicznego dostępu dodaj nginx z basic auth lub VPN

