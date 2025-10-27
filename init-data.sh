#!/bin/bash
# Inicjalizacja struktury katalogów dla aplikacji DnD

echo "Tworzenie struktury katalogów..."

mkdir -p data/DnD
mkdir -p data/fog-states
mkdir -p data/grid-configs
mkdir -p data/characters
mkdir -p data/settings

echo ""
echo "Struktura katalogów utworzona:"
echo "  ./data/DnD           - Obrazy map"
echo "  ./data/fog-states    - Stany mgły"
echo "  ./data/grid-configs  - Konfiguracje siatki"
echo "  ./data/characters    - Postacie"
echo "  ./data/settings      - Ustawienia"
echo ""
echo "Gotowe! Możesz teraz uruchomić aplikację."
echo ""

