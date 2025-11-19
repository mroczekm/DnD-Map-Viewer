// fog.js - Obsługa mgły
class FogManager {
    constructor(viewer) {
        this.viewer = viewer;
    }

    toggleFogMode(mode) {
        if (mode === 'paint') {
            this.viewer.isPaintingFog = !this.viewer.isPaintingFog;
            if (this.viewer.isPaintingFog) {
                this.viewer.isErasingFog = false;
            }
        } else if (mode === 'erase') {
            this.viewer.isErasingFog = !this.viewer.isErasingFog;
            if (this.viewer.isErasingFog) {
                this.viewer.isPaintingFog = false;
            }
        }


        // Aktualizuj wygląd przycisków
        this.updateFogButtonStates();
        this.viewer.updateCursor();

        // Jeśli wyłączamy wszystkie tryby, wyczyść highlight
        if (!this.viewer.isPaintingFog && !this.viewer.isErasingFog) {
            this.viewer.clearHighlight();
        }
    }

    updateFogButtonStates() {
        if (this.viewer.paintFogBtn) {
            this.viewer.paintFogBtn.classList.remove('active');
        }
        if (this.viewer.eraseFogBtn) {
            this.viewer.eraseFogBtn.classList.remove('active');
        }

        if (this.viewer.isPaintingFog && this.viewer.paintFogBtn) {
            this.viewer.paintFogBtn.classList.add('active');
        } else if (this.viewer.isErasingFog && this.viewer.eraseFogBtn) {
            this.viewer.eraseFogBtn.classList.add('active');
        }
    }

    paintFogAtPosition(x, y, radius = 20) {
        if (!this.viewer.gridSize) {
            // Tryb wolnego malowania gdy brak siatki
            // Najpierw wyczyść obszar aby uniknąć nakładania
            this.viewer.fogCtx.globalCompositeOperation = 'destination-out';
            this.viewer.fogCtx.beginPath();
            this.viewer.fogCtx.arc(x, y, radius, 0, 2 * Math.PI);
            this.viewer.fogCtx.fill();

            // Teraz namaluj nową mgłę z kolorami z kontrolek
            this.viewer.fogCtx.globalCompositeOperation = 'source-over';
            const fogColorRgba = this.hexToRgba(this.viewer.fogColor, this.viewer.fogOpacity);
            this.viewer.fogCtx.fillStyle = fogColorRgba;
            this.viewer.fogCtx.beginPath();
            this.viewer.fogCtx.arc(x, y, radius, 0, 2 * Math.PI);
            this.viewer.fogCtx.fill();
        } else {
            // Tryb kratek gdy jest siatka
            this.paintFogGridArea(x, y);
        }
        this.saveFogToServer('paint', x, y, radius);
    }

    eraseFogAtPosition(x, y, radius = 20) {
        if (!this.viewer.gridSize) {
            // Tryb wolnego usuwania gdy brak siatki
            this.viewer.fogCtx.globalCompositeOperation = 'destination-out';
            this.viewer.fogCtx.beginPath();
            this.viewer.fogCtx.arc(x, y, radius, 0, 2 * Math.PI);
            this.viewer.fogCtx.fill();
        } else {
            // Tryb kratek gdy jest siatka
            this.eraseFogGridArea(x, y);
        }
        this.saveFogToServer('erase', x, y, radius);
    }

    paintFogGridArea(x, y) {
        const cell = this.viewer.getGridCell(x, y);
        if (!cell) return;

        // Oblicz zakres kratek do pomalowania
        const isOdd = this.viewer.gridAreaSizeValue % 2 === 1;
        const half = Math.floor(this.viewer.gridAreaSizeValue / 2);
        const startOffset = isOdd ? -half : -half;
        const endOffset = isOdd ? half : half - 1;

        // Najpierw wyczyść obszar (usuń istniejącą mgłę)
        this.viewer.fogCtx.globalCompositeOperation = 'destination-out';
        this.viewer.fogCtx.fillStyle = 'rgba(0,0,0,1)';

        for (let dx = startOffset; dx <= endOffset; dx++) {
            for (let dy = startOffset; dy <= endOffset; dy++) {
                const cellX = cell.x + dx * this.viewer.gridSize;
                const cellY = cell.y + dy * this.viewer.gridSize;
                if (cellX < 0 || cellY < 0 || cellX + this.viewer.gridSize > this.viewer.currentMap.width ||
                    cellY + this.viewer.gridSize > this.viewer.currentMap.height) continue;
                this.viewer.fogCtx.fillRect(cellX, cellY, this.viewer.gridSize, this.viewer.gridSize);
            }
        }

        // Teraz namaluj nową mgłę z kolorami z kontrolek
        this.viewer.fogCtx.globalCompositeOperation = 'source-over';
        const fogColorRgba = this.hexToRgba(this.viewer.fogColor, this.viewer.fogOpacity);
        this.viewer.fogCtx.fillStyle = fogColorRgba;

        for (let dx = startOffset; dx <= endOffset; dx++) {
            for (let dy = startOffset; dy <= endOffset; dy++) {
                const cellX = cell.x + dx * this.viewer.gridSize;
                const cellY = cell.y + dy * this.viewer.gridSize;
                if (cellX < 0 || cellY < 0 || cellX + this.viewer.gridSize > this.viewer.currentMap.width ||
                    cellY + this.viewer.gridSize > this.viewer.currentMap.height) continue;
                this.viewer.fogCtx.fillRect(cellX, cellY, this.viewer.gridSize, this.viewer.gridSize);

                // Dodaj punkt do kolejki do zapisania na serwerze - usuń z odkrytych obszarów
                this.viewer.queueCell(cellX, cellY, 'paint');
            }
        }
    }

    eraseFogGridArea(x, y) {
        const cell = this.viewer.getGridCell(x, y);
        if (!cell) return;

        // Oblicz zakres kratek do usunięcia
        const isOdd = this.viewer.gridAreaSizeValue % 2 === 1;
        const half = Math.floor(this.viewer.gridAreaSizeValue / 2);
        const startOffset = isOdd ? -half : -half;
        const endOffset = isOdd ? half : half - 1;

        this.viewer.fogCtx.globalCompositeOperation = 'destination-out';

        for (let dx = startOffset; dx <= endOffset; dx++) {
            for (let dy = startOffset; dy <= endOffset; dy++) {
                const cellX = cell.x + dx * this.viewer.gridSize;
                const cellY = cell.y + dy * this.viewer.gridSize;
                if (cellX < 0 || cellY < 0 || cellX + this.viewer.gridSize > this.viewer.currentMap.width ||
                    cellY + this.viewer.gridSize > this.viewer.currentMap.height) continue;
                this.viewer.fogCtx.fillRect(cellX, cellY, this.viewer.gridSize, this.viewer.gridSize);

                // Dodaj punkt do kolejki do zapisania na serwerze
                this.viewer.queueCell(cellX, cellY, 'erase');
            }
        }
    }

    async saveFogToServer(action, x, y, radius) {
        if (!this.viewer.currentMap) return;

        try {
            let endpoint, body;
            if (action === 'paint') {
                // Malowanie mgły = usuwanie z odkrytych obszarów
                endpoint = `hide-batch`;
                body = [{
                    x: x,
                    y: y,
                    radius: radius || 20,
                    isGridCell: !!this.viewer.gridSize
                }];
            } else {
                // Usuwanie mgły = dodawanie do odkrytych obszarów
                endpoint = `reveal-batch`;
                body = [{
                    x: x,
                    y: y,
                    radius: radius || 20,
                    isGridCell: !!this.viewer.gridSize
                }];
            }

            await fetch(`/api/fog/${this.viewer.currentMap.name}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } catch (e) {
            console.error('Błąd zapisu mgły na serwer:', e);
        }
    }

    queueFogCell(x, y, action) {
        this.viewer.pendingFogPoints.push({
            x: x,
            y: y,
            radius: this.viewer.gridSize / 2,
            action: action,
            isGridCell: true
        });

        // NAPRAWKA: Oznacz czas lokalnej zmiany dla synchronizacji
        this.viewer.lastLocalFogChange = Date.now();

        if (this.viewer.pendingFogPoints.length >= 10) this.viewer.flushPending();
        else this.viewer.scheduleFlush();
    }

    async resetFog() {
        if (!this.viewer.currentMap) {
            alert('❌ Nie wybrano mapy!');
            return;
        }

        const confirmation = confirm('❓ Czy na pewno chcesz zresetować mgłę dla tej mapy?\n\n⚠️ Ta operacja usunie wszystkie odkryte obszary!');
        if (!confirmation) return;

        try {
            const response = await fetch(`/api/fog/${encodeURIComponent(this.viewer.currentMap.name)}/reset`, {
                method: 'POST'
            });

            if (response.ok) {
                // Wyczyść lokalne dane mgły
                this.viewer.fogCtx.clearRect(0, 0, this.viewer.fogCanvas.width, this.viewer.fogCanvas.height);

                // Renderuj pełną mgłę
                await this.renderFullFog();

                alert('✅ Mgła została zresetowana!');
            } else {
                const error = await response.text();
                alert(`❌ Błąd podczas resetowania mgły: ${error}`);
                console.error('❌ Fog reset error:', error);
            }
        } catch (error) {
            console.error('❌ Fog reset error:', error);
            alert(`❌ Błąd podczas resetowania mgły: ${error.message}`);
        }
    }

    async renderFullFog() {
        if (!this.viewer.currentMap) return;

        // Wyczyść canvas
        this.viewer.fogCtx.clearRect(0, 0, this.viewer.currentMap.width, this.viewer.currentMap.height);

        // Namaluj pełną mgłę
        this.viewer.fogCtx.globalCompositeOperation = 'source-over';
        const fogColorRgba = this.hexToRgba(this.viewer.fogColor, this.viewer.fogOpacity);
        this.viewer.fogCtx.fillStyle = fogColorRgba;
        this.viewer.fogCtx.fillRect(0, 0, this.viewer.currentMap.width, this.viewer.currentMap.height);
    }

    async loadFogState() {
        if (!this.viewer.currentMap) return;

        try {
            const response = await fetch(`/api/fog-states/${encodeURIComponent(this.viewer.currentMap.name)}`);
            if (response.ok) {
                const fogState = await response.json();
                await this.renderFogFromState(fogState);
            } else {
                // Jeśli nie ma stanu mgły, wyrenderuj pełną mgłę
                await this.renderFullFog();
            }
        } catch (error) {
            console.error('❌ Fog load error:', error);
            await this.renderFullFog(); // Fallback do pełnej mgły
        }
    }

    async renderFogFromState(fogState) {
        if (!this.viewer.currentMap || !fogState) return;

        // Najpierw wyrenderuj pełną mgłę
        await this.renderFullFog();

        // Następnie usuń odkryte obszary
        if (fogState.revealedAreas && fogState.revealedAreas.length > 0) {
            this.viewer.fogCtx.globalCompositeOperation = 'destination-out';
            this.viewer.fogCtx.fillStyle = 'rgba(0,0,0,1)';

            for (const area of fogState.revealedAreas) {
                // NAPRAWKA: Zawsze rysuj kwadraty zamiast kółek (zgodnie z wymaganiem)
                const cellX = area.x - area.radius;
                const cellY = area.y - area.radius;
                this.viewer.fogCtx.fillRect(cellX, cellY, area.radius * 2, area.radius * 2);
            }
        }
    }

    async saveFogState() {
        if (!this.viewer.currentMap) return;

        try {
            const imageData = this.viewer.fogCtx.getImageData(0, 0, this.viewer.fogCanvas.width, this.viewer.fogCanvas.height);
            const fogState = {
                imageData: Array.from(imageData.data),
                width: imageData.width,
                height: imageData.height,
                revealedAreas: [] // Zachowaj kompatybilność
            };

            const response = await fetch(`/api/fog-states/${encodeURIComponent(this.viewer.currentMap.name)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fogState)
            });

        if (response.ok) {
            // Usunięto log
        } else {
                console.error('❌ Fog save error:', await response.text());
            }
        } catch (error) {
            console.error('❌ Fog save error:', error);
        }
    }

    startFogSynchronization() {
        if (this.viewer.fogPollingInterval) {
            clearInterval(this.viewer.fogPollingInterval);
        }

        this.viewer.fogPollingInterval = setInterval(() => {
            this.syncFogState();
        }, 3000); // Sprawdzaj co 3 sekundy
    }

    stopFogSynchronization() {
        if (this.viewer.fogPollingInterval) {
            clearInterval(this.viewer.fogPollingInterval);
            this.viewer.fogPollingInterval = null;
        }
    }

    async syncFogState() {
        if (!this.viewer.currentMap) return;

        try {
            // NAPRAWKA: Jeśli trwa lokalne malowanie, pomiń synchronizację
            if (this.viewer.isPaintingFog || this.viewer.isErasingFog) {
                return;
            }

            // NAPRAWKA: Throttling - nie synchronizuj zbyt często po lokalnych zmianach
            const now = Date.now();
            if (this.viewer.lastLocalFogChange && (now - this.viewer.lastLocalFogChange) < 2000) {
                return;
            }

            // NAPRAWKA: Zapisz lokalne zmiany przed sprawdzeniem synchronizacji
            if (this.viewer.pendingFogPoints && this.viewer.pendingFogPoints.length > 0) {
                await this.viewer.flushPending();
                // Poczekaj chwilę żeby serwer przetworzy zmiany
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            const response = await fetch(`/api/fog-states/${encodeURIComponent(this.viewer.currentMap.name)}/hash`);
            if (response.ok) {
                const data = await response.json();
                const newHash = data.hash;

                if (this.viewer.lastFogStateHash && this.viewer.lastFogStateHash !== newHash) {
                    // Stan mgły zmienił się, załaduj nowy stan
                    await this.loadFogState();
                }

                this.viewer.lastFogStateHash = newHash;
            }
        } catch (error) {
            console.error('❌ Fog sync error:', error);
        }
    }

    updateFogColorFromView() {
        this.viewer.fogColor = this.viewer.fogColorPickerView.value;
        this.renderFog();
        this.viewer.saveMapSettings();
    }

    async renderFog() {
        // Ponownie wyrenderuj mgłę z nowym kolorem
        await this.loadFogState();
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

// Debug - sprawdź czy klasa jest dostępna
console.log('✅ FogManager class loaded');
window.FogManager = FogManager;

// Eksport dla innych modułów
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FogManager;
}
