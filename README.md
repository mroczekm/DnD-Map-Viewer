# 🎲 DnD Map Viewer

Zaawansowana aplikacja webowa do prowadzenia sesji Dungeons & Dragons z interaktywną mgłą wojny, siatką i podglądem dla graczy w czasie rzeczywistym.

![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.7-brightgreen)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## 📋 Spis treści

- [Funkcje](#-funkcje)
- [Wymagania](#-wymagania)
- [Szybki start](#-szybki-start)
- [Instalacja](#-instalacja)
- [Użytkowanie](#-użytkowanie)
- [Docker](#-docker)
- [Architektura](#-architektura)
- [API](#-api)
- [Konfiguracja](#-konfiguracja)
- [Backup i przywracanie](#-backup-i-przywracanie)
- [Rozwiązywanie problemów](#-rozwiązywanie-problemów)

## ✨ Funkcje

### 🗺️ Zarządzanie mapami
- **Upload map** - Dodawaj mapy bezpośrednio z interfejsu (JPG, PNG, GIF)
- **Wybór mapy** - Lista rozwijana ze wszystkimi dostępnymi mapami
- **Usuwanie map** - Usuń mapę wraz ze wszystkimi powiązanymi danymi
- **Automatyczne odświeżanie** - Lista map aktualizuje się po każdej zmianie
- **Obsługa dużych plików** - Do 50MB (konfigurowalny limit)

### 🌫️ Mgła wojny
- **Tryb usuwania** - Kliknij i przeciągnij aby odsłonić obszar
- **Tryb malowania** - Kliknij i przeciągnij aby zasłonić obszar
- **Rozmiar pędzla** - 1x1, 2x2, 3x3 kratek siatki
- **Reset mgły** - Przywróć pełną mgłę na całej mapie
- **Dostosowanie koloru i przezroczystości** - Wybierz idealny wygląd mgły
- **Automatyczny zapis** - Co 30 sekund
- **Synchronizacja w czasie rzeczywistym** - Zmiany widoczne natychmiast dla graczy

### 📐 Kalibracja siatki
- **Kalibracja wizualna** - Kliknij dwa razy po przekątnej kratki
- **Automatyczne przeliczanie** - Wprowadź ilość kratek X/Y, a aplikacja wyliczy rozmiar
- **Ręczna konfiguracja** - Precyzyjna kontrola (z dokładnością do 0.1px):
  - Rozmiar kratki
  - Offset X/Y
  - Grubość linii (0.1 - 10px)
- **Kolor i przezroczystość** - Dopasuj siatkę do mapy
- **Pokrycie całej mapy** - Siatka rozciąga się na całą powierzchnię
- **Natychmiastowy podgląd** - Wszystkie zmiany widoczne od razu
- **Automatyczny zapis** - Co 30 sekund

### 👥 System postaci
- **Dodaj gracza** - Zielony okrąg na wybranej kratce
- **Dodaj wroga** - Czerwona litera (A, B, C...) na wybranej kratce
- **Usuń postać** - Kliknij aby usunąć pojedynczą postać
- **Przeciąganie** - SHIFT + przeciągnij aby przenieść postać
- **Dostosowanie kolorów** - Zmiana kolorów dla graczy i wrogów
- **Grupowe usuwanie** - Usuń wszystkich graczy/wrogów jednym kliknięciem
- **Synchronizacja** - Postacie widoczne również na podglądzie dla graczy

### 🔍 Nawigacja i widok
- **Zoom** - Przyciski +/- lub scroll myszką (1x - 5x)
- **Pan** - Przeciągnij myszką aby przesunąć mapę
- **Obrót mapy** - Obróć mapę o 90° w lewo lub prawo
- **Reset widoku** - Przywróć domyślne ustawienia
- **Ramka podglądu** - Wizualizacja tego, co widzą gracze
- **Kolor ramki** - Dostosuj kolor ramki podglądu
- **Nawigacja klawiaturą** - Strzałki do przesuwania
- **Automatyczny zapis pozycji** - Co 30 sekund

### 🎮 Podgląd dla graczy (osobne okno)
- **Osobny widok** - Otwórz na drugim monitorze dla graczy
- **Animowana mgła** - Realistyczny, poruszający się efekt mgły
- **Synchronizacja automatyczna** - Odświeżanie co 2 sekundy
- **Widoczne postacie** - Gracze i wrogowie na mapie
- **Kontrola z głównego okna** - Nawigacja i zoom sterowane przez GM
- **Tryb pełnoekranowy** - Czysty widok bez kontrolek
- **Brak interakcji** - Tylko widok, gracze nie mogą niczego zmienić

### 💾 Persistencja i automatyczny zapis
- **Auto-save** - Wszystkie ustawienia zapisywane co 30 sekund:
  - Mgła wojny
  - Siatka
  - Postacie
  - Zoom, pan, rotacja
  - Kolory i przezroczystość
  - Widoczność elementów
- **Brak localStorage** - Wszystkie dane w plikach
- **Zachowanie stanu** - Stan sesji zachowany między uruchomieniami
- **Backup-friendly** - Jeden katalog ze wszystkimi danymi

## 🔧 Wymagania

### Minimalne
- **Java**: 21 lub nowsza (JDK, nie JRE)
- **RAM**: 512 MB
- **Przestrzeń dyskowa**: 100 MB + miejsce na mapy
- **Przeglądarka**: Chrome/Firefox/Edge (najnowsze wersje)

### Zalecane
- **Java**: 21
- **RAM**: 1 GB
- **Maven**: 3.6+ (lub użyj dołączonego Maven Wrapper)
- **Docker**: Najnowsza wersja (dla uruchomienia w kontenerze)

## 🚀 Szybki start

### Windows

```cmd
# 1. Sklonuj/pobierz repozytorium
cd C:\Users\mrocz\IdeaProjects\DnD

# 2. Uruchom aplikację (Maven Wrapper)
mvnw.cmd spring-boot:run

# 3. Otwórz w przeglądarce
# GM: http://localhost:8080/gm
# Gracze: http://localhost:8080/view
```

### Linux/Mac

```bash
# 1. Sklonuj/pobierz repozytorium
cd ~/IdeaProjects/DnD

# 2. Uruchom aplikację (Maven Wrapper)
./mvnw spring-boot:run

# 3. Otwórz w przeglądarce
# GM: http://localhost:8080/gm
# Gracze: http://localhost:8080/view
```

### Docker

```bash
# Uruchom z docker-compose
docker-compose up -d

# Otwórz w przeglądarce
# GM: http://localhost:8080/gm
# Gracze: http://localhost:8080/view
```

## 📦 Instalacja

### 1. Sprawdź środowisko

```cmd
# Sprawdź wersję Java (wymagane JDK 21+)
java -version
javac -version
```

Jeśli nie masz JDK lub masz starszą wersję, pobierz z:
- https://adoptium.net/ (Eclipse Temurin)
- https://www.oracle.com/java/technologies/downloads/

### 2. Sklonuj/pobierz projekt

```cmd
git clone <repository-url>
cd DnD
```

### 3. Skompiluj projekt

```cmd
# Windows
mvnw.cmd clean package

# Linux/Mac
./mvnw clean package
```

### 4. Uruchom aplikację

```cmd
# Windows
mvnw.cmd spring-boot:run

# Linux/Mac
./mvnw spring-boot:run

# Lub bezpośrednio z JAR
java -jar target/DnD-0.0.1-SNAPSHOT.jar
```

### 5. Otwórz w przeglądarce

- **Panel GM**: http://localhost:8080/gm
- **Podgląd dla graczy**: http://localhost:8080/view

## 📖 Użytkowanie

### Dodawanie pierwszej mapy

1. Kliknij **"Dodaj mapę"** w sekcji "Wybór mapy"
2. Wybierz plik obrazu (JPG, PNG, GIF)
3. Podaj nazwę mapy (bez rozszerzenia)
4. Kliknij **"Upload"**
5. Wybierz mapę z listy rozwijanej

### Konfiguracja siatki

#### Metoda 1: Automatyczna (zalecana)

1. Otwórz sekcję **"Kalibracja siatki"**
2. Wprowadź ilość kratek w poziomie (X)
3. Wprowadź ilość kratek w pionie (Y)
4. Aplikacja automatycznie wyliczy rozmiar kratki
5. Kliknij **"Zapisz"**

**Przykład**: Dla mapy 2000x1500px:
- 20 kratek X → 100px na kratkę
- 15 kratek Y → 100px na kratkę

#### Metoda 2: Wizualna kalibracja

1. Kliknij **"Kalibruj"**
2. Kliknij w jeden róg kratki
3. Kliknij w przeciwległy róg tej samej kratki
4. Aplikacja wyliczy rozmiar i offset
5. Kliknij **"Zapisz"**

#### Metoda 3: Ręczna

1. Wprowadź ręcznie:
   - Rozmiar kratki (px)
   - Offset X (px)
   - Offset Y (px)
   - Grubość linii (px)
2. Dostosuj kolor i przezroczystość
3. Kliknij **"Zapisz"**

### Używanie mgły wojny

#### Odsłanianie obszarów

1. Kliknij **"Usuń mgłę"**
2. Wybierz rozmiar pędzla (1x1, 2x2, 3x3)
3. Kliknij i przeciągnij po mapie
4. Mgła zostanie usunięta w wybranym obszarze

#### Zasłanianie obszarów

1. Kliknij **"Maluj mgłę"**
2. Wybierz rozmiar pędzla
3. Kliknij i przeciągnij po mapie
4. Mgła zostanie dodana w wybranym obszarze

#### Reset mgły

1. Kliknij **"Reset mgły"**
2. Potwierdź akcję
3. Cała mapa zostanie zasłonięta

### Dodawanie postaci

#### Gracze (okręgi)

1. Kliknij **"Dodaj gracza"**
2. Kliknij na wybraną kratkę
3. Zostanie dodany zielony okrąg
4. SHIFT + przeciągnij aby przenieść

#### Wrogowie (litery)

1. Kliknij **"Dodaj wroga"**
2. Kliknij na wybraną kratkę
3. Zostanie dodana czerwona litera (A, B, C...)
4. SHIFT + przeciągnij aby przenieść

#### Usuwanie postaci

- **Pojedyncza**: Kliknij "Usuń postać", potem kliknij na postać
- **Ostatni gracz**: Kliknij "Usuń ostatniego gracza"
- **Wszyscy gracze**: Kliknij "Usuń wszystkich graczy"
- **Ostatni wróg**: Kliknij "Usuń ostatniego wroga"
- **Wszyscy wrogowie**: Kliknij "Usuń wszystkich wrogów"

### Nawigacja i widok

#### Zoom

- **Przyciski +/-**: Zwiększ/zmniejsz zoom
- **Scroll myszką**: Zoom w pozycji kursora
- **Zakres**: 1x - 5x

#### Przesuwanie (Pan)

- **Przeciągnij myszką**: Przesuń mapę
- **Strzałki nawigacyjne**: Precyzyjne przesuwanie
- **Przycisk centrum**: Wycentruj mapę

#### Obrót

- **Obróć w lewo**: -90°
- **Obróć w prawo**: +90°
- **Reset**: Przywróć 0°

### Podgląd dla graczy

1. Otwórz **http://localhost:8080/view** na drugim monitorze/ekranie
2. Gracze widzą tylko odsłoniętą część mapy
3. Mgła jest animowana i porusza się
4. Postacie są widoczne
5. GM kontroluje widok z głównego okna

## 🐳 Docker

### Uruchomienie

```bash
# Zbuduj i uruchom
docker-compose up -d

# Sprawdź logi
docker-compose logs -f

# Zatrzymaj
docker-compose down
```

### Struktura danych

Wszystkie dane w **jednym** katalogu `./data`:

```
./data/
├── DnD/              # Obrazy map (*.jpg, *.png)
├── fog-states/       # Stany mgły (auto-save)
├── grid-configs/     # Konfiguracje siatki (auto-save)
├── characters/       # Postacie (auto-save)
└── settings/         # Ustawienia (auto-save)
```

### Zmienne środowiskowe

```bash
# Katalogi (domyślne w docker-compose.yml)
DND_MAPS_DIR=/app/data/DnD
DND_FOG_DIR=/app/data/fog-states
DND_GRID_DIR=/app/data/grid-configs
DND_CHARACTERS_DIR=/app/data/characters
DND_SETTINGS_DIR=/app/data/settings

# Port
SERVER_PORT=8080
```

Szczegółowe informacje w [DOCKER.md](DOCKER.md)

## 🏗️ Architektura

### Technologie

#### Backend
- **Spring Boot 3.5.7** - Framework aplikacji webowych
- **Spring Web** - REST API
- **Thymeleaf** - Silnik szablonów HTML
- **Jackson** - Serializacja/deserializacja JSON
- **Java 21** - Język programowania

#### Frontend
- **Vanilla JavaScript** - Bez dodatkowych frameworków
- **Canvas API** - Rysowanie mgły i siatki
- **Material Design** - Ikony i komponenty UI
- **CSS3** - Style i animacje

### Struktura projektu

```
DnD/
├── src/main/
│   ├── java/com/dnd/
│   │   ├── DnDApplication.java              # Główna klasa
│   │   ├── config/
│   │   │   └── MapConfiguration.java        # Konfiguracja katalogów
│   │   ├── controller/
│   │   │   ├── ViewController.java          # Widoki (HTML)
│   │   │   ├── MapController.java           # API map
│   │   │   ├── FogController.java           # API mgły
│   │   │   ├── GridController.java          # API siatki
│   │   │   ├── CharacterController.java     # API postaci
│   │   │   ├── MapSettingsController.java   # API ustawień
│   │   │   ├── PreviewMapController.java    # API podglądu
│   │   │   └── MapFileController.java       # Serwowanie plików
│   │   ├── model/
│   │   │   ├── MapInfo.java                 # Model mapy
│   │   │   ├── FogState.java                # Model mgły
│   │   │   ├── CharacterData.java           # Model postaci
│   │   │   └── MapSettings.java             # Model ustawień
│   │   └── service/
│   │       ├── MapService.java              # Logika map
│   │       ├── FogService.java              # Logika mgły
│   │       ├── GridService.java             # Logika siatki
│   │       ├── CharacterService.java        # Logika postaci
│   │       ├── MapSettingsService.java      # Logika ustawień
│   │       └── PreviewMapService.java       # Logika podglądu
│   └── resources/
│       ├── application.properties           # Konfiguracja
│       ├── static/
│       │   ├── css/
│       │   │   └── style.css                # Style CSS
│       │   └── js/
│       │       └── app.js                   # Logika JavaScript
│       └── templates/
│           ├── index.html                   # Panel GM
│           └── podglad.html                 # Widok dla graczy
├── data/                                     # Dane (tworzone automatycznie)
│   ├── DnD/                                 # Mapy
│   ├── fog-states/                          # Mgła
│   ├── grid-configs/                        # Siatka
│   ├── characters/                          # Postacie
│   └── settings/                            # Ustawienia
├── docker-compose.yml                        # Docker Compose
├── Dockerfile                                # Definicja obrazu Docker
├── pom.xml                                   # Konfiguracja Maven
└── README.md                                 # Dokumentacja
```

## 🔌 API

### Mapy

```http
GET    /api/maps                    # Lista wszystkich map
GET    /api/maps/{mapName}          # Informacje o mapie
POST   /api/maps/upload             # Upload nowej mapy
DELETE /api/maps/{mapName}          # Usunięcie mapy
GET    /api/map-files/{filename}    # Pobranie pliku mapy
```

### Mgła wojny

```http
GET    /api/fog/{mapName}                  # Stan mgły dla mapy
POST   /api/fog/{mapName}/reveal-batch     # Odsłoń obszary (batch)
POST   /api/fog/{mapName}/hide-batch       # Zasłoń obszary (batch)
POST   /api/fog/{mapName}/reset            # Reset mgły
```

### Siatka

```http
GET    /api/grid/{mapName}          # Konfiguracja siatki
POST   /api/grid/{mapName}          # Zapisz konfigurację
DELETE /api/grid/{mapName}          # Usuń konfigurację
```

### Postacie

```http
GET    /api/characters/{mapName}    # Postacie na mapie
POST   /api/characters/{mapName}    # Zapisz postacie
```

### Ustawienia

```http
GET    /api/settings/{mapName}      # Ustawienia mapy
POST   /api/settings/{mapName}      # Zapisz ustawienia
```

### Podgląd

```http
GET    /api/preview-map                    # Nazwa mapy na podglądzie
POST   /api/preview-map                    # Ustaw mapę na podglądzie
POST   /api/preview-map/navigation         # Sterowanie nawigacją
POST   /api/preview-map/viewport           # Raportowanie viewportu
GET    /api/preview-map/viewport           # Pobranie viewportu
```

## ⚙️ Konfiguracja

### application.properties

```properties
# Nazwa aplikacji
spring.application.name=DnD

# Katalogi danych (ścieżki względne lub bezwzględne)
app.maps.directory=${DND_MAPS_DIR:DnD}
app.fog-states.directory=${DND_FOG_DIR:fog-states}
app.grid-configs.directory=${DND_GRID_DIR:grid-configs}
app.characters.directory=${DND_CHARACTERS_DIR:characters}
app.settings.directory=${DND_SETTINGS_DIR:settings}

# Port serwera (domyślnie 8080)
server.port=8080

# Maksymalny rozmiar uploadowanych plików
spring.servlet.multipart.max-file-size=50MB
spring.servlet.multipart.max-request-size=50MB
```

### Zmiana portów

```properties
# W application.properties
server.port=9090
```

Lub przez zmienną środowiskową:
```bash
SERVER_PORT=9090 java -jar target/DnD-0.0.1-SNAPSHOT.jar
```

### Zmiana katalogów

```properties
# W application.properties
app.maps.directory=C:/dnd-data/maps
app.fog-states.directory=C:/dnd-data/fog
app.grid-configs.directory=C:/dnd-data/grid
app.characters.directory=C:/dnd-data/characters
app.settings.directory=C:/dnd-data/settings
```

Lub przez zmienne środowiskowe:
```bash
DND_MAPS_DIR=/custom/path/maps java -jar target/DnD-0.0.1-SNAPSHOT.jar
```

## 💾 Backup i przywracanie

### Backup (lokalny)

```bash
# Windows
tar -czf dnd-backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%.tar.gz data

# Linux/Mac
tar -czf dnd-backup-$(date +%Y%m%d).tar.gz data
```

### Restore (lokalny)

```bash
# Rozpakuj backup
tar -xzf dnd-backup-20241027.tar.gz
```

### Backup (Docker)

```bash
# Backup wolumenu Docker
docker run --rm \
  -v dnd_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/dnd-backup-$(date +%Y%m%d).tar.gz -C /data .

# Restore wolumenu Docker
docker run --rm \
  -v dnd_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/dnd-backup-20241027.tar.gz -C /data
```

## 🐛 Rozwiązywanie problemów

### Aplikacja nie uruchamia się

**Problem**: `Error: No compiler is provided`
```
Rozwiązanie:
1. Upewnij się, że masz JDK (nie JRE)
2. Ustaw JAVA_HOME na katalog JDK
3. Dodaj %JAVA_HOME%\bin do PATH
```

**Problem**: `Port 8080 already in use`
```
Rozwiązanie:
1. Zmień port w application.properties
2. Lub zatrzymaj aplikację używającą portu 8080
```

### Upload mapy nie działa

**Problem**: `Maximum upload size exceeded`
```
Rozwiązanie:
Zwiększ limit w application.properties:
spring.servlet.multipart.max-file-size=100MB
spring.servlet.multipart.max-request-size=100MB
```

### Mgła nie synchronizuje się

**Problem**: Zmiany mgły nie są widoczne dla graczy
```
Rozwiązanie:
1. Sprawdź czy podgląd jest otwarty na tej samej mapie
2. Odśwież stronę podglądu (F5)
3. Sprawdź logi w konsoli przeglądarki (F12)
```

### Siatka się nie wyświetla

**Problem**: Siatka nie jest widoczna po kalibracji
```
Rozwiązanie:
1. Sprawdź czy siatka jest włączona (przycisk "Pokaż siatkę")
2. Sprawdź kolor siatki - może być niewidoczny na jasnym tle
3. Sprawdź grubość linii - może być zbyt mała
```

### Dane nie zapisują się

**Problem**: Ustawienia/mgła/postacie nie są zapisywane
```
Rozwiązanie:
1. Sprawdź uprawnienia do katalogów danych
2. Sprawdź logi aplikacji w konsoli
3. Sprawdź czy jest wystarczająco miejsca na dysku
```

### Docker - problemy z wolumenami

**Problem**: Dane znikają po restarcie kontenera
```
Rozwiązanie:
1. Upewnij się, że używasz docker-compose.yml
2. Sprawdź czy katalog ./data istnieje
3. Sprawdź uprawnienia do katalogu ./data
```

### Problemy z wydajnością

**Problem**: Aplikacja działa wolno przy dużych mapach
```
Rozwiązanie:
1. Zmniejsz rozmiar map (max 4096x4096px zalecane)
2. Użyj formatu JPG zamiast PNG dla dużych map
3. Zwiększ pamięć JVM: java -Xmx2G -jar app.jar
```

## 📝 Formaty plików

### Mgła wojna (fog-states/*.json)
```json
{
  "mapName": "Zamek",
  "revealedAreas": [
    {
      "x": 100,
      "y": 150,
      "radius": 50
    }
  ]
}
```

### Siatka (grid-configs/*_grid.json)
```json
{
  "gridSize": 100,
  "offsetX": 0,
  "offsetY": 0
}
```

### Postacie (characters/*_characters.json)
```json
{
  "characters": {
    "players": [
      {"x": 5, "y": 3}
    ],
    "enemies": [
      {"x": 10, "y": 7, "letter": "A"}
    ]
  },
  "playerColor": "#00ff00",
  "enemyColor": "#ff0000",
  "enemyLetterCounter": 1
}
```

### Ustawienia (settings/*_settings.json)
```json
{
  "rotation": 0,
  "zoom": 1.5,
  "panOffset": {"x": 100, "y": 50},
  "gridColor": "#ffffff",
  "fogColor": "#808080",
  "fogOpacity": 0.65,
  "previewViewportColor": "#ff0000",
  "previewViewportVisible": true,
  "gridVisible": true
}
```

## 🤝 Wsparcie

Jeśli masz pytania lub napotkasz problemy:

1. Sprawdź sekcję [Rozwiązywanie problemów](#-rozwiązywanie-problemów)
2. Przejrzyj [CHANGELOG.md](CHANGELOG.md) dla informacji o zmianach
3. Sprawdź [DOCKER.md](DOCKER.md) dla problemów z Dockerem

## 📄 Licencja

Projekt stworzony dla potrzeb sesji Dungeons & Dragons.

## 🎯 Roadmap

- [ ] Obsługa wielu warstw map (poziomy)
- [ ] System tokenów dla przedmiotów
- [ ] Chat dla graczy
- [ ] Dziennik akcji
- [ ] Export sesji do PDF
- [ ] Inicjatywa i śledzenie tur
- [ ] Biblioteka efektów wizualnych
- [ ] Wsparcie dla map wektorowych (SVG)

---

**Miłej gry!** 🎲✨

