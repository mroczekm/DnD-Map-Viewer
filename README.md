# DnD Map Viewer - Aplikacja do wyświetlania map z mgłą wojny

## Opis aplikacji

Zaawansowana aplikacja do prowadzenia sesji DnD z funkcją mgły wojny, siatki i podglądu dla graczy. Pozwala na:
- **Zarządzanie mapami**: Wczytywanie, dodawanie i usuwanie map z interfejsu
- **Mgła wojny**: Odsłanianie i malowanie mgły z animacją na podglądzie
- **Siatka**: Kalibracja i wizualizacja siatki na mapie
- **Postacie**: Dodawanie graczy (okręgi) i wrogów (litery) na siatce
- **Podgląd**: Osobne okno dla graczy z animowaną mgłą i ramką widoku
- **Nawigacja**: Kontrola zoom i pan z synchronizacją między widokami
- **Obrót mapy**: Obracanie mapy z zachowaniem wszystkich ustawień
- **Persistencja**: Automatyczny zapis wszystkich stanów

## Konfiguracja

Aplikacja używa pliku `src/main/resources/application.properties` do konfiguracji:

```properties
# Katalog z mapami (pliki .jpg, .jpeg, .png, .gif)
app.maps.directory=DnD

# Katalog do zapisywania stanów mgły wojny
app.fog-states.directory=fog-states

# Katalog do zapisywania konfiguracji siatki
app.grid-configs.directory=grid-configs

# Port serwera
server.port=8080

# Maksymalny rozmiar uploadowanych plików (domyślnie 50MB)
spring.servlet.multipart.max-file-size=50MB
spring.servlet.multipart.max-request-size=50MB
```

## Wymagania

- Java 21 lub nowsza (JDK, nie JRE)
- Maven 3.6+ lub użyj dołączonego Maven Wrapper

## Struktura projektu

```
DnD/
├── src/main/java/com/dnd/
│   ├── DnDApplication.java              # Główna klasa aplikacji
│   ├── config/
│   │   └── MapConfiguration.java        # Konfiguracja katalogów
│   ├── model/
│   │   ├── MapInfo.java                 # Model informacji o mapie
│   │   └── FogState.java                # Model stanu mgły wojny
│   ├── service/
│   │   ├── MapService.java              # Serwis zarządzania mapami
│   │   └── FogService.java              # Serwis zarządzania mgłą wojny
│   └── controller/
│       ├── ViewController.java          # Kontroler widoku
│       ├── MapController.java           # REST API dla map
│       ├── FogController.java           # REST API dla mgły wojny
│       └── MapFileController.java       # Serwowanie plików map
├── src/main/resources/
│   ├── application.properties           # Konfiguracja aplikacji
│   └── templates/
│       └── index.html                   # Frontend aplikacji
└── pom.xml                             # Konfiguracja Maven
```

## Instalacja i uruchomienie

### 1. Przygotowanie środowiska
Upewnij się, że masz zainstalowany JDK 21+ (nie JRE). Sprawdź wersję:
```cmd
java -version
javac -version
```

### 2. Utworzenie katalogów
Utwórz katalogi dla map i stanów mgły:
```cmd
mkdir C:\dnd\maps
mkdir C:\dnd\fog-states
```

### 3. Dodanie map
Skopiuj swoje mapy (pliki .jpg, .jpeg, .png, .gif) do katalogu `C:\dnd\maps`

### 4. Kompilacja i uruchomienie
```cmd
# Przejdź do katalogu projektu
cd C:\Users\mrocz\IdeaProjects\DnD

# Kompilacja (używaj Maven Wrapper jeśli nie masz Maven)
.\mvnw.cmd clean compile

# Uruchomienie aplikacji
.\mvnw.cmd spring-boot:run
```

### 5. Dostęp do aplikacji
Otwórz przeglądarkę i przejdź na adres: http://localhost:8080

## Funkcjonalność

### Zarządzanie Mapami
- **Wybór mapy**: Lista rozwijana z wszystkimi dostępnymi mapami
- **Dodaj mapę**: Upload nowej mapy bezpośrednio z interfejsu (JPG, PNG, GIF)
- **Usuń mapę**: Usuwanie wybranej mapy wraz z wszystkimi danymi
- **Automatyczne odświeżanie**: Lista map aktualizuje się po dodaniu/usunięciu

### Mgła Wojny
- **Usuń mgłę**: Kliknij i przeciągnij aby odsłonić obszar
- **Maluj mgłę**: Kliknij i przeciągnij aby zasłonić obszar
- **Rozmiar pędzla**: 2x2, 3x3, 4x4 lub 10x10 kratek siatki
- **Reset mgły**: Przywrócenie pełnej mgły na mapie
- **Kolory**: Możliwość zmiany koloru i przezroczystości mgły
- **Synchronizacja**: Automatyczny zapis i synchronizacja z podglądem
- **Optymalizacja**: Automatyczne usuwanie duplikatów (limit 1000 punktów)

### Kalibracja Siatki
- **Kalibruj**: Kliknij dwa razy po przekątnej kratki aby skalibrować
- **Ilość kratek X/Y**: Wprowadź ilość kratek aby automatycznie wyliczyć rozmiar
  - Np. dla mapy 2000x1500px: 20 kratek X, 15 kratek Y → rozmiar kratki ~87.5px
  - Siatka automatycznie rozciąga się na całą mapę
- **Ręczna konfiguracja**: 
  - Rozmiar kratki (z precyzją do 0.1px)
  - Offset X/Y (z precyzją do 0.1px)
  - Grubość linii (0.1 - 10px, z precyzją do 0.1)
- **Natychmiastowy podgląd**: Wszystkie zmiany widoczne od razu podczas wpisywania
- **Kolor siatki**: Zmiana koloru siatki dla lepszej widoczności
- **Pełne pokrycie**: Siatka pokrywa całą mapę od krawędzi do krawędzi
- **Zapisywanie**: Automatyczny zapis konfiguracji dla każdej mapy (przycisk "Zapisz")

### Moduł Postaci
- **Dodaj gracza**: Zielony okrąg na wybranej kratce
- **Dodaj wroga**: Czerwona litera (A, B, C...) na wybranej kratce
- **Usuń postać**: Kliknij aby usunąć pojedynczą postać
- **Przeciąganie**: SHIFT + przeciągnij postać na inną kratkę
- **Kolory**: Zmiana kolorów dla graczy i wrogów
- **Grupowe usuwanie**: Usuń wszystkich graczy/wrogów jednym kliknięciem
- **Synchronizacja**: Postacie widoczne również na podglądzie

### Widok i Nawigacja
- **Zoom**: Przyciski +/- lub scroll myszką (1x - 5x)
- **Pan**: Przeciągnij myszką aby przesunąć mapę
- **Obrót**: Obróć mapę o 90° w lewo lub prawo
- **Reset**: Przywrócenie domyślnego widoku
- **Podgląd**: Ramka pokazująca co widzą gracze
- **Kolor ramki**: Zmiana koloru ramki podglądu
- **Pokaż/Ukryj**: Włącz/wyłącz ramkę podglądu

### Podgląd dla Graczy (osobne okno)
- **Animowana mgła**: Realistyczny, poruszający się efekt mgły
- **Synchronizacja**: Automatyczna aktualizacja co 2 sekundy
- **Postacie**: Gracze i wrogowie widoczni na mapie
- **Nawigacja z index**: Przyciski sterują widokiem na podglądzie
- **Pełnoekranowy**: Idealny do wyświetlenia na drugim monitorze
- **Bez kontrolek**: Czysty widok tylko z mapą

### Frontend
- **Ciemny motyw**: Dostosowany do sesji DnD
- **Responsywny panel**: Zwijane sekcje dla lepszej organizacji
- **Material Design**: Nowoczesne ikony i przyciski
- **Kursor krzyżyka**: Podczas kalibracji siatki
- **Podświetlanie**: Aktywne przyciski i kratki
- **Status**: Informacje o mapie i rozmiarze

### Backend API

#### Mapy
- `GET /api/maps` - Lista wszystkich map
- `GET /api/maps/{mapName}` - Informacje o mapie
- `POST /api/maps/upload` - Upload nowej mapy
- `DELETE /api/maps/{mapName}` - Usunięcie mapy
- `GET /api/map-files/{filename}` - Pobranie pliku mapy

#### Mgła wojny
- `GET /api/fog/{mapName}` - Stan mgły dla mapy
- `POST /api/fog/{mapName}/reveal-batch` - Odsłoń obszary (batch)
- `POST /api/fog/{mapName}/hide-batch` - Zasłoń obszary (batch)
- `POST /api/fog/{mapName}/reset` - Reset mgły

#### Siatka
- `GET /api/grid/{mapName}` - Konfiguracja siatki
- `POST /api/grid/{mapName}` - Zapisz konfigurację siatki
- `DELETE /api/grid/{mapName}` - Usuń konfigurację siatki

#### Postacie
- `GET /api/characters/{mapName}` - Postacie na mapie
- `POST /api/characters/{mapName}` - Zapisz postacie

#### Podgląd
- `GET /api/preview-map` - Nazwa mapy na podglądzie
- `POST /api/preview-map` - Ustaw mapę na podglądzie
- `POST /api/preview-map/navigation` - Sterowanie nawigacją
- `POST /api/preview-map/viewport` - Raportowanie viewportu
- `GET /api/preview-map/viewport` - Pobranie viewportu

### Obsługa danych
- **Automatyczne zapisywanie**: Wszystkie zmiany są natychmiast zapisywane
- **Persistencja**: Stany zachowane między sesjami
- **Optymalizacja**: Automatyczne usuwanie duplikatów i kompresja danych
- **Backup**: Automatyczne backupy uszkodzonych plików
- **Cache**: Inteligentne cachowanie dla lepszej wydajności

## Pliki stanów mgły

Stany mgły są zapisywane w formacie JSON w katalogu `app.fog-states.directory`:
```json
{
  "mapName": "nazwa_mapy",
  "revealedAreas": [
    {
      "x": 100,
      "y": 150,
      "radius": 50
    }
  ]
}
```

## Rozwiązywanie problemów

### Problem z rozmiarem uploadowanego pliku
Jeśli otrzymujesz błąd "Maximum upload size exceeded":
1. Zwiększ limit w `application.properties`:
```properties
spring.servlet.multipart.max-file-size=100MB
spring.servlet.multipart.max-request-size=100MB
```
2. Zrestartuj aplikację
3. Domyślny limit to 50MB - można go zwiększyć według potrzeb

### Problem z kompilatorem
Jeśli otrzymujesz błąd "No compiler is provided in this environment":
1. Upewnij się, że masz zainstalowany JDK (nie JRE)
2. Ustaw zmienną środowiskową JAVA_HOME na katalog JDK
3. Dodaj `%JAVA_HOME%\bin` do zmiennej PATH

### Problem z katalogami
Jeśli katalogi nie istnieją, aplikacja automatycznie je utworzy przy pierwszym uruchomieniu.

### Problem z mapami
- Obsługiwane formaty: .jpg, .jpeg, .png, .gif
- Pliki muszą być czytelne dla aplikacji
- Nazwa mapy to nazwa pliku bez rozszerzenia

## Rozwój aplikacji

Aplikacja używa:
- **Spring Boot 3.5.7** - Framework webowy
- **Thymeleaf** - Silnik szablonów
- **Jackson** - Serializacja JSON
- **Canvas API** - Rysowanie mgły wojny
- **Vanilla JavaScript** - Frontend bez dodatkowych bibliotek

## Licencja

Projekt dla potrzeb sesji DnD.
