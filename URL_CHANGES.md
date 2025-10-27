# Zmiana adresów URL - Podsumowanie

## ✅ Wykonane zmiany

### 1. Backend - ViewController.java
- Zmieniono `@GetMapping("/")` na `@GetMapping("/gm")` - panel admina (GM)
- Zmieniono `@GetMapping("/podglad")` na `@GetMapping("/view")` - widok dla graczy

### 2. Dokumentacja - README.md
Zaktualizowano wszystkie odniesienia do URL:
- Sekcja "Szybki start - Windows": `/gm` i `/view`
- Sekcja "Szybki start - Linux/Mac": `/gm` i `/view`
- Sekcja "Szybki start - Docker": `/gm` i `/view`
- Sekcja "Instalacja - punkt 5": `/gm` i `/view`
- Sekcja "Użytkowanie - Podgląd dla graczy": `/view`

### 3. Dokumentacja - DOCKER.md
- Zaktualizowano sekcję "Otwórz aplikację": `/gm` i `/view`

### 4. Dokumentacja - CHANGELOG.md
- Zaktualizowano sekcję z instrukcjami Docker: dodano `/gm` i `/view`

## 🌐 Nowe adresy URL

Po uruchomieniu aplikacji:

- **Panel GM (Game Master)**: `http://localhost:8080/gm`
- **Widok dla graczy**: `http://localhost:8080/view`

## ⚠️ Uwaga

Po tej zmianie:
- Stare URL (`http://localhost:8080` i `http://localhost:8080/podglad`) **nie będą działać**
- Należy zaktualizować zakładki/linki w przeglądarkach
- Poinformuj wszystkich użytkowników o nowych adresach

## 🔄 Jak przetestować

1. Uruchom aplikację:
   ```cmd
   mvnw.cmd spring-boot:run
   ```

2. Otwórz w przeglądarce:
   - GM: http://localhost:8080/gm
   - Gracze: http://localhost:8080/view

3. Sprawdź czy obie strony się ładują poprawnie

## 📝 Pliki zmienione

- `src/main/java/com/dnd/controller/ViewController.java`
- `README.md`
- `DOCKER.md`
- `CHANGELOG.md`

