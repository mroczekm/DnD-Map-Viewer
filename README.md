# DnD Map Viewer - Aplikacja do wyświetlania map z mgłą wojny

## Opis aplikacji

Aplikacja do wyświetlania map DnD w przeglądarce z funkcją mgły wojny. Pozwala na:
- Wczytywanie map z lokalnego katalogu
- Przełączanie między mapami
- Odsłanianie mgły wojny przez klikanie i przeciąganie myszką
- Zapisywanie stanu odsłonięcia mapy
- Resetowanie mgły wojny
- Regulację rozmiaru pędzla do odsłaniania

## Konfiguracja

Aplikacja używa pliku `src/main/resources/application.properties` do konfiguracji:

```properties
# Katalog z mapami (pliki .jpg, .jpeg, .png, .gif)
app.maps.directory=C:/dnd/maps

# Katalog do zapisywania stanów mgły wojny
app.fog-states.directory=C:/dnd/fog-states

# Port serwera
server.port=8080
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

### Frontend
- **Interfejs użytkownika**: Ciemny motyw dostosowany do sesji DnD
- **Selektor map**: Lista dostępnych map w katalogu
- **Kontrola pędzla**: Suwak do regulacji rozmiaru obszaru odsłaniania (10-150px)
- **Przycisk Reset**: Zasłania całą mapę ponownie
- **Pasek statusu**: Informacje o aktualnej mapie i instrukcje

### Backend API

#### Endpointy map
- `GET /api/maps` - Lista wszystkich dostępnych map
- `GET /api/maps/{mapName}` - Informacje o konkretnej mapie
- `GET /api/maps/{filename}` - Pobranie pliku mapy

#### Endpointy mgły wojny
- `GET /api/fog/{mapName}` - Stan mgły dla mapy
- `POST /api/fog/{mapName}/reveal?x={x}&y={y}&radius={radius}` - Odsłoń obszar
- `POST /api/fog/{mapName}/reset` - Resetuj mgłę wojny

### Obsługa mgły wojny
- **Automatyczne zapisywanie**: Stan odsłonięcia jest automatycznie zapisywany w plikach JSON
- **Interaktywność**: Kliknij i przeciągnij myszką aby odsłonić mgłę
- **Persistencja**: Stan mgły jest zachowywany między sesjami
- **Reset**: Możliwość pełnego zresetowania mgły dla mapy

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
