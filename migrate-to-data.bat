@echo off
REM Skrypt migracji istniejących danych do struktury ./data

echo ================================
echo  Migracja danych do ./data
echo ================================
echo.

REM Utwórz strukturę katalogów
call init-data.bat

echo.
echo Migrowanie istniejących plików...
echo.

REM Sprawdź czy katalogi źródłowe istnieją i przenieś pliki
if exist "DnD\*" (
    echo Migrowanie map z DnD/ do data/DnD/...
    xcopy "DnD\*" "data\DnD\" /E /I /Y
    echo   Skopiowano: DnD/
)

if exist "fog-states\*" (
    echo Migrowanie stanów mgły z fog-states/ do data/fog-states/...
    xcopy "fog-states\*" "data\fog-states\" /E /I /Y
    echo   Skopiowano: fog-states/
)

if exist "grid-configs\*" (
    echo Migrowanie siatek z grid-configs/ do data/grid-configs/...
    xcopy "grid-configs\*" "data\grid-configs\" /E /I /Y
    echo   Skopiowano: grid-configs/
)

if exist "characters\*" (
    echo Migrowanie postaci z characters/ do data/characters/...
    xcopy "characters\*" "data\characters\" /E /I /Y
    echo   Skopiowano: characters/
)

if exist "settings\*" (
    echo Migrowanie ustawień z settings/ do data/settings/...
    xcopy "settings\*" "data\settings\" /E /I /Y
    echo   Skopiowano: settings/
)

echo.
echo ================================
echo  Migracja zakończona!
echo ================================
echo.
echo Wszystkie dane są teraz w katalogu ./data
echo Możesz bezpiecznie usunąć stare katalogi jeśli chcesz:
echo   rmdir /s DnD fog-states grid-configs characters settings
echo.
pause

