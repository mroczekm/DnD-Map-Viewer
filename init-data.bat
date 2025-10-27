@echo off
REM Inicjalizacja struktury katalogów dla aplikacji DnD

echo Tworzenie struktury katalogow...

mkdir data 2>nul
mkdir data\DnD 2>nul
mkdir data\fog-states 2>nul
mkdir data\grid-configs 2>nul
mkdir data\characters 2>nul
mkdir data\settings 2>nul

echo.
echo Struktura katalogow utworzona:
echo   ./data/DnD           - Obrazy map
echo   ./data/fog-states    - Stany mgly
echo   ./data/grid-configs  - Konfiguracje siatki
echo   ./data/characters    - Postacie
echo   ./data/settings      - Ustawienia
echo.
echo Gotowe! Mozesz teraz uruchomic aplikacje.
echo.
pause

