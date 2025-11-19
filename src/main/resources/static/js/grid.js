// grid.js - Obsługa siatki i kalibracji
class GridManager {
    constructor(viewer) {
        this.viewer = viewer;
        // Usunięto lokalną kopię gridAreaSizeValue - używamy tej z viewer
    }

    drawGrid() {
        this.viewer.gridCtx.clearRect(0, 0, this.viewer.currentMap.width, this.viewer.currentMap.height);

        // NAPRAWIONE: Rysuj podświetlenie ZAWSZE (nawet gdy siatka jest niewidoczna)
        if (this.viewer.highlightCenterCell && this.viewer.gridSize) {
            const isOdd = this.viewer.gridAreaSizeValue % 2 === 1;
            const half = Math.floor(this.viewer.gridAreaSizeValue / 2);
            const startOffset = isOdd ? -half : -half;
            const endOffset = isOdd ? half : half - 1;
            let fillColor, strokeColor;

            if (this.viewer.isPaintingFog) {
                fillColor = 'rgba(255,0,0,0.25)';
                strokeColor = 'rgba(255,0,0,0.7)';
            } else if (this.viewer.isErasingFog) {
                fillColor = 'rgba(0,100,255,0.25)';
                strokeColor = 'rgba(0,100,255,0.7)';
            } else if (this.viewer.isAltPressed) {
                fillColor = 'rgba(0,255,0,0.25)';
                strokeColor = 'rgba(0,255,0,0.7)';
            }

            if (fillColor && strokeColor) {
                for (let dx = startOffset; dx <= endOffset; dx++) {
                    for (let dy = startOffset; dy <= endOffset; dy++) {
                        const cellX = this.viewer.highlightCenterCell.x + dx * this.viewer.gridSize;
                        const cellY = this.viewer.highlightCenterCell.y + dy * this.viewer.gridSize;
                        if (cellX < 0 || cellY < 0 || cellX + this.viewer.gridSize > this.viewer.currentMap.width ||
                            cellY + this.viewer.gridSize > this.viewer.currentMap.height) continue;
                        this.viewer.gridCtx.fillStyle = fillColor;
                        this.viewer.gridCtx.fillRect(cellX, cellY, this.viewer.gridSize, this.viewer.gridSize);
                        this.viewer.gridCtx.strokeStyle = strokeColor;
                        this.viewer.gridCtx.strokeRect(cellX, cellY, this.viewer.gridSize, this.viewer.gridSize);
                    }
                }
            }
        }

        if (!this.viewer.gridSize || !this.viewer.gridVisible) {
            return;
        }

        // Użyj kolorów i grubości linii z kontrolek
        const gridColorRgba = this.hexToRgba(this.viewer.gridColor, this.viewer.gridOpacity);
        this.viewer.gridCtx.strokeStyle = gridColorRgba;
        this.viewer.gridCtx.lineWidth = this.viewer.gridLineWidth;

        // Rysuj linie pionowe - zaczynaj DOKŁADNIE od offsetu
        for (let x = this.viewer.gridOffsetX; x <= this.viewer.currentMap.width; x += this.viewer.gridSize) {
            this.viewer.gridCtx.beginPath();
            this.viewer.gridCtx.moveTo(x, 0);
            this.viewer.gridCtx.lineTo(x, this.viewer.currentMap.height);
            this.viewer.gridCtx.stroke();
        }

        // Rysuj linie poziome - zaczynaj DOKŁADNIE od offsetu
        for (let y = this.viewer.gridOffsetY; y <= this.viewer.currentMap.height; y += this.viewer.gridSize) {
            this.viewer.gridCtx.beginPath();
            this.viewer.gridCtx.moveTo(0, y);
            this.viewer.gridCtx.lineTo(this.viewer.currentMap.width, y);
            this.viewer.gridCtx.stroke();
        }
    }


    getGridCell(x, y) {
        if (!this.viewer.gridSize) return null;

        // Dodaj margines tolerancji dla błędów zaokrągleń przy krawędziach (5px)
        const EDGE_TOLERANCE = 5;

        // Przytnij współrzędne do granic mapy z tolerancją
        const clampedX = Math.max(0, Math.min(x, this.viewer.currentMap.width - 0.01));
        const clampedY = Math.max(0, Math.min(y, this.viewer.currentMap.height - 0.01));

        // Sprawdź czy kliknięcie jest w granicach mapy (z tolerancją dla krawędzi)
        if (x < -EDGE_TOLERANCE || y < -EDGE_TOLERANCE ||
            x > this.viewer.currentMap.width + EDGE_TOLERANCE ||
            y > this.viewer.currentMap.height + EDGE_TOLERANCE) {
            return null;
        }

        // Uwzględnij offset przy wyliczaniu pozycji kratki (użyj przyciętych współrzędnych)
        const ax = clampedX - this.viewer.gridOffsetX;
        const ay = clampedY - this.viewer.gridOffsetY;

        // Jeśli kliknięcie jest przed offsetem ale w mapie, użyj pierwszej kratki
        const cellIndexX = ax < 0 ? 0 : Math.floor(ax / this.viewer.gridSize);
        const cellIndexY = ay < 0 ? 0 : Math.floor(ay / this.viewer.gridSize);

        // Wylicz pozycję kratki (lewy górny róg)
        const cellX = cellIndexX * this.viewer.gridSize + this.viewer.gridOffsetX;
        const cellY = cellIndexY * this.viewer.gridSize + this.viewer.gridOffsetY;

        return { x: cellX, y: cellY };
    }

    updateHighlight(e) {
        if (!this.viewer.gridSize) {
            this.clearHighlight();
            return;
        }

        // Sprawdź czy jesteśmy w trybie mgły lub Alt
        const shouldHighlight = this.viewer.isAltPressed || this.viewer.isPaintingFog || this.viewer.isErasingFog;

        if (!shouldHighlight) {
            this.clearHighlight();
            return;
        }

        const pos = this.viewer.getMousePos(e);
        const cell = this.getGridCell(pos.x, pos.y);

        if (!cell) {
            this.clearHighlight();
            return;
        }

        const changed = !this.viewer.highlightCenterCell || cell.x !== this.viewer.highlightCenterCell.x ||
            cell.y !== this.viewer.highlightCenterCell.y;

        if (changed) {
            this.viewer.highlightCenterCell = cell;
            this.drawGrid();
        }
    }

    clearHighlight() {
        if (this.viewer.highlightCenterCell) {
            this.viewer.highlightCenterCell = null;
            this.drawGrid();
        }
    }

    toggleGrid() {
        this.viewer.gridVisible = !this.viewer.gridVisible;
        this.drawGrid();

        if (this.viewer.toggleGridBtn) {
            this.viewer.toggleGridBtn.textContent = this.viewer.gridVisible ? 'Ukryj siatkę' : 'Pokaż siatkę';
            this.viewer.toggleGridBtn.classList.toggle('active', this.viewer.gridVisible);
        }
    }

    startGridCalibration() {
        if (!this.viewer.currentMap) {
            alert('❌ Najpierw wybierz mapę!');
            return;
        }
        this.viewer.isCalibrating = true;
        this.viewer.calibrationStart = null;
        this.viewer.calibrationCurrent = null;
        this.viewer.updateCursor();
        alert('🎯 Kliknij i przeciągnij aby wyznaczyć odległość znaną w kratkach.\n\nKrok 1: Kliknij punkt startowy');
    }

    handleCalibrationClick(e) {
        if (!this.viewer.calibrationStart) {
            // Pierwszy klik - ustaw punkt startowy
            this.viewer.calibrationStart = this.viewer.getMousePos(e);
            this.renderCalibrationOverlay();
            alert('✅ Punkt startowy ustawiony!\n\nKrok 2: Kliknij punkt końcowy');
        } else {
            // Drugi klik - ustaw punkt końcowy i zakończ kalibrację
            this.viewer.calibrationCurrent = this.viewer.getMousePos(e);
            this.finishCalibration();
        }
    }

    finishCalibration() {
        if (!this.viewer.calibrationStart || !this.viewer.calibrationCurrent) return;

        const dx = this.viewer.calibrationCurrent.x - this.viewer.calibrationStart.x;
        const dy = this.viewer.calibrationCurrent.y - this.viewer.calibrationStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const squares = prompt('🔢 Ile kratek wynosi ta odległość?', '5');
        if (!squares || isNaN(squares) || parseFloat(squares) <= 0) {
            this.cancelCalibration();
            return;
        }

        const squareCount = parseFloat(squares);
        const calculatedGridSize = distance / squareCount;

        this.viewer.gridSize = calculatedGridSize;
        if (this.viewer.gridSizeInput) {
            this.viewer.gridSizeInput.value = calculatedGridSize.toFixed(1);
        }

        // Wyczyść kalibrację
        this.viewer.isCalibrating = false;
        this.viewer.calibrationStart = null;
        this.viewer.calibrationCurrent = null;
        this.viewer.calibrationCtx.clearRect(0, 0, this.viewer.calibrationCanvas.width, this.viewer.calibrationCanvas.height);

        // Oblicz offset aby wyśrodkować siatkę
        this.centerGrid();

        this.drawGrid();
        this.viewer.updateCursor();

        if (this.viewer.gridStatus) {
            this.viewer.gridStatus.textContent = `Siatka: ${calculatedGridSize.toFixed(1)}px (niezapisana)`;
        }

        alert(`✅ Kalibracja zakończona!\nRozmiar kratki: ${calculatedGridSize.toFixed(1)}px\n\n💡 Pamiętaj o zapisaniu konfiguracji!`);
    }

    cancelCalibration() {
        this.viewer.isCalibrating = false;
        this.viewer.calibrationStart = null;
        this.viewer.calibrationCurrent = null;
        this.viewer.calibrationCtx.clearRect(0, 0, this.viewer.calibrationCanvas.width, this.viewer.calibrationCanvas.height);
        this.viewer.updateCursor();
    }

    renderCalibrationOverlay() {
        this.viewer.calibrationCtx.clearRect(0, 0, this.viewer.calibrationCanvas.width, this.viewer.calibrationCanvas.height);

        if (!this.viewer.calibrationStart) return;

        const transform = this.viewer.mapContainer.style.transform;
        this.viewer.calibrationCanvas.style.transform = transform;

        this.viewer.calibrationCtx.strokeStyle = '#ff0000';
        this.viewer.calibrationCtx.lineWidth = 3;
        this.viewer.calibrationCtx.setLineDash([10, 5]);

        this.viewer.calibrationCtx.beginPath();
        this.viewer.calibrationCtx.moveTo(this.viewer.calibrationStart.x, this.viewer.calibrationStart.y);

        if (this.viewer.calibrationCurrent) {
            this.viewer.calibrationCtx.lineTo(this.viewer.calibrationCurrent.x, this.viewer.calibrationCurrent.y);
        }

        this.viewer.calibrationCtx.stroke();
        this.viewer.calibrationCtx.setLineDash([]);

        // Narysuj punkty
        this.viewer.calibrationCtx.fillStyle = '#ff0000';
        this.viewer.calibrationCtx.beginPath();
        this.viewer.calibrationCtx.arc(this.viewer.calibrationStart.x, this.viewer.calibrationStart.y, 8, 0, 2 * Math.PI);
        this.viewer.calibrationCtx.fill();

        if (this.viewer.calibrationCurrent) {
            this.viewer.calibrationCtx.beginPath();
            this.viewer.calibrationCtx.arc(this.viewer.calibrationCurrent.x, this.viewer.calibrationCurrent.y, 8, 0, 2 * Math.PI);
            this.viewer.calibrationCtx.fill();
        }
    }

    calculateGridSizeFromCount() {
        if (!this.viewer.currentMap) return;

        const countX = parseInt(this.viewer.gridCountXInput.value);
        const countY = parseInt(this.viewer.gridCountYInput.value);

        if (countX > 0 && countY > 0) {
            const sizeX = this.viewer.currentMap.width / countX;
            const sizeY = this.viewer.currentMap.height / countY;

            // Użyj mniejszego rozmiaru aby kratki zmieściły się w obu wymiarach
            const size = Math.min(sizeX, sizeY);

            this.viewer.gridSize = size;
            if (this.viewer.gridSizeInput) {
                this.viewer.gridSizeInput.value = size.toFixed(1);
            }

            // Wyśrodkuj siatkę
            this.centerGrid();
            this.drawGrid();

            if (this.viewer.gridStatus) {
                this.viewer.gridStatus.textContent = `Siatka: ${size.toFixed(1)}px (niezapisana)`;
            }
        }
    }

    centerGrid() {
        if (!this.viewer.currentMap || !this.viewer.gridSize) return;

        // Oblicz ile kratek zmieści się w mapie
        const gridsX = Math.floor(this.viewer.currentMap.width / this.viewer.gridSize);
        const gridsY = Math.floor(this.viewer.currentMap.height / this.viewer.gridSize);

        // Oblicz pozostałą przestrzeń
        const remainingX = this.viewer.currentMap.width - (gridsX * this.viewer.gridSize);
        const remainingY = this.viewer.currentMap.height - (gridsY * this.viewer.gridSize);

        // Wyśrodkuj siatkę
        this.viewer.gridOffsetX = remainingX / 2;
        this.viewer.gridOffsetY = remainingY / 2;

        // Aktualizuj pola input
        if (this.viewer.gridOffsetXInput) {
            this.viewer.gridOffsetXInput.value = this.viewer.gridOffsetX.toFixed(1);
        }
        if (this.viewer.gridOffsetYInput) {
            this.viewer.gridOffsetYInput.value = this.viewer.gridOffsetY.toFixed(1);
        }
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    async saveGridConfig() {
        if (!this.viewer.currentMap) {
            alert('❌ Nie wybrano mapy!');
            return;
        }

        if (!this.viewer.gridSize) {
            alert('❌ Nie skonfigurowano siatki!');
            return;
        }

        const config = {
            gridSize: this.viewer.gridSize,
            offsetX: this.viewer.gridOffsetX,
            offsetY: this.viewer.gridOffsetY,
            lineWidth: this.viewer.gridLineWidth
        };

        try {
            const response = await fetch(`/api/grid-configs/${encodeURIComponent(this.viewer.currentMap.name)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                // Użyj saveMapSettings - bezpieczne dla mgły
                if (this.viewer.saveMapSettings) {
                    this.viewer.saveMapSettings().catch(err =>
                        console.error('Error saving grid settings:', err)
                    );
                }

                if (this.viewer.gridStatus) {
                    this.viewer.gridStatus.textContent = `Siatka: ${this.viewer.gridSize.toFixed(1)}px (zapisana)`;
                    this.viewer.gridStatus.style.color = '#28a745';
                    setTimeout(() => {
                        if (this.viewer.gridStatus) this.viewer.gridStatus.style.color = '';
                    }, 2000);
                }
            } else {
                const error = await response.text();
                alert(`❌ Błąd podczas zapisywania siatki: ${error}`);
                console.error('❌ Grid save error:', error);
            }
        } catch (error) {
            console.error('❌ Grid save error:', error);
            alert(`❌ Błąd podczas zapisywania siatki: ${error.message}`);
        }
    }

    async loadGridConfig() {
        if (!this.viewer.currentMap) return;

        try {
            const response = await fetch(`/api/grid-configs/${encodeURIComponent(this.viewer.currentMap.name)}`);
            if (response.ok) {
                const config = await response.json();
                this.viewer.gridSize = config.gridSize;
                this.viewer.gridOffsetX = config.offsetX || 0;
                this.viewer.gridOffsetY = config.offsetY || 0;
                this.viewer.gridLineWidth = config.lineWidth || 1.0;

                // Aktualizuj kontrolki
                if (this.viewer.gridSizeInput) this.viewer.gridSizeInput.value = config.gridSize.toFixed(1);
                if (this.viewer.gridOffsetXInput) this.viewer.gridOffsetXInput.value = this.viewer.gridOffsetX.toFixed(1);
                if (this.viewer.gridOffsetYInput) this.viewer.gridOffsetYInput.value = this.viewer.gridOffsetY.toFixed(1);
                if (this.viewer.gridLineWidthInput) this.viewer.gridLineWidthInput.value = this.viewer.gridLineWidth.toFixed(1);

                this.drawGrid();
                if (this.viewer.gridStatus) {
                    this.viewer.gridStatus.textContent = `Siatka: ${config.gridSize.toFixed(1)}px`;
                }
            }
        } catch (error) {
            console.error('❌ Grid load error:', error);
        }
    }

    clearGridConfig() {
        this.viewer.gridSize = null;
        this.viewer.gridOffsetX = 0;
        this.viewer.gridOffsetY = 0;
        this.viewer.gridLineWidth = 1.0;
        this.viewer.gridVisible = false;

        // Wyczyść kontrolki
        if (this.viewer.gridSizeInput) this.viewer.gridSizeInput.value = '';
        if (this.viewer.gridOffsetXInput) this.viewer.gridOffsetXInput.value = '0';
        if (this.viewer.gridOffsetYInput) this.viewer.gridOffsetYInput.value = '0';
        if (this.viewer.gridLineWidthInput) this.viewer.gridLineWidthInput.value = '1.0';

        // Wyczyść canvas
        if (this.viewer.gridCtx) {
            this.viewer.gridCtx.clearRect(0, 0, this.viewer.gridCanvas.width, this.viewer.gridCanvas.height);
        }

        if (this.viewer.gridStatus) {
            this.viewer.gridStatus.textContent = 'Siatka nieaktywna';
        }

        if (this.viewer.toggleGridBtn) {
            this.viewer.toggleGridBtn.textContent = 'Pokaż siatkę';
            this.viewer.toggleGridBtn.classList.remove('active');
        }
    }
}

// Debug - sprawdź czy klasa jest dostępna
console.log('✅ GridManager class loaded');
window.GridManager = GridManager;

// Eksport dla innych modułów
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GridManager;
}
