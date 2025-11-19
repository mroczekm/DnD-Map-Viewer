// viewport.js - Obsługa podglądu i nawigacji
console.log('🚀 LOADING VIEWPORT.JS - START');

class ViewportManager {
    constructor(viewer) {
        this.viewer = viewer;
    }

    // ...existing code...

    clampPan() {
        if (!this.viewer.currentMap) return;
        const containerWidth = this.viewer.mapContainer.clientWidth;
        const containerHeight = this.viewer.mapContainer.clientHeight;
        const mapWidth = this.viewer.currentMap.width * this.viewer.zoom;
        const mapHeight = this.viewer.currentMap.height * this.viewer.zoom;
        // Maksymalne ujemne przesunięcie (gdy przesuwamy mapę w lewo/górę aby odsłonić prawy/dolny fragment)
        const maxNegX = Math.max(0, mapWidth - containerWidth);
        const maxNegY = Math.max(0, mapHeight - containerHeight);
        // Ogranicz: dodatnie przesunięcie nie większe niż 0 (nie odsłaniamy pustki z lewej/góry)
        if (this.viewer.panOffset.x > 0) this.viewer.panOffset.x = 0;
        if (this.viewer.panOffset.y > 0) this.viewer.panOffset.y = 0;
        // Ujemne przesunięcie nie mniejsze niż -maxNeg
        if (this.viewer.panOffset.x < -maxNegX) this.viewer.panOffset.x = -maxNegX;
        if (this.viewer.panOffset.y < -maxNegY) this.viewer.panOffset.y = -maxNegY;
    }

    // Funkcje zoom
    // Zoom dla podglądu - krok 5%
    async zoomIn() {
        if (this.viewer.remotePreviewControl) {
            // Sterowanie zoomem podglądu
            fetch('/api/preview-map/navigation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'zoom', direction: 'in', step: 5 }) // 5% krok
            }).catch(()=>{});
            setTimeout(() => this.fetchPreviewViewport(), 150);
        }

        // Zapisz zoom podglądu w ustawieniach mapy
        await this.savePreviewZoom();
        this.reportCurrentViewport();
    }

    async zoomOut() {
        if (this.viewer.remotePreviewControl) {
            // Sterowanie zoomem podglądu
            fetch('/api/preview-map/navigation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'zoom', direction: 'out', step: 5 }) // 5% krok
            }).catch(()=>{});
            setTimeout(() => this.fetchPreviewViewport(), 150);
        }

        // Zapisz zoom podglądu w ustawieniach mapy
        await this.savePreviewZoom();
        this.reportCurrentViewport();
    }

    // Ustawienie dokładnej wartości zoom podglądu
    async setPreviewZoomPercent(percent) {
        if (this.viewer.remotePreviewControl) {
            const zoomValue = percent / 100;
            fetch('/api/preview-map/navigation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'zoom', direction: 'set', value: zoomValue })
            }).catch(()=>{});
            setTimeout(() => this.fetchPreviewViewport(), 150);
        }

        // Zapisz zoom podglądu w ustawieniach mapy
        this.viewer.previewZoom = percent; // Zapisz jako procenty

        // Aktualizuj wyświetlanie
        if (this.viewer.zoomLevel && this.viewer.zoomLevel.tagName === 'INPUT') {
            this.viewer.zoomLevel.value = percent;
        }

        // Zapisz zoom podglądu w ustawieniach mapy
        await this.savePreviewZoom(percent);
        this.reportCurrentViewport();
    }

    // Zapisywanie zoom podglądu w ustawieniach mapy
    async savePreviewZoom(previewZoom) {
        if (!this.viewer.currentMap) return;

        // Pobierz aktualny zoom z input lub użyj parametru
        let zoomPercent = previewZoom;
        if (!zoomPercent && this.viewer.zoomLevel && this.viewer.zoomLevel.tagName === 'INPUT') {
            zoomPercent = parseInt(this.viewer.zoomLevel.value) || 100;
        }

        this.viewer.previewZoom = zoomPercent;
        console.log('🎯 ViewportManager wywołuje saveMapSettings() - bezpieczne dla mgły');
        this.viewer.saveMapSettings(); // Tylko settings, nie nadpisuj całego pliku
    }

    async resetZoom() {
        this.viewer.zoom = 1;
        this.viewer.panOffset.x = 0;
        this.viewer.panOffset.y = 0;
        this.clampPan();
        this.viewer.applyTransform();
        this.updateZoomDisplay();
        console.log('🎯 ViewportManager.resetZoom() wywołuje saveMapSettings()');
        this.viewer.saveMapSettings(); // Tylko settings, nie nadpisuj całego pliku
        this.reportCurrentViewport();
    }

    // Funkcje zoom GM (precise controls) - sterują mapą w GM
    async setGMZoomPercent(percent) {
        const newZoom = Math.max(0.1, Math.min(percent / 100, 5));
        this.viewer.zoom = newZoom;

        this.clampPan();
        this.viewer.applyTransform();
        this.updateZoomInput(); // Tylko GM zoom input
        console.log('🎯 ViewportManager.setGMZoomPercent() wywołuje saveMapSettings()');
        this.viewer.saveMapSettings(); // Tylko settings, nie nadpisuj całego pliku
        this.reportCurrentViewport();
    }

    async adjustGMZoomByPercent(percentChange) {
        const currentPercent = Math.round(this.viewer.zoom * 100);
        const newPercent = Math.max(10, Math.min(currentPercent + percentChange, 500));
        await this.setGMZoomPercent(newPercent);
    }

    // Stare funkcje do kompatybilności - teraz dla podglądu
    async setZoomPercent(percent) {
        // Przekierowanie na GM zoom dla kompatybilności
        await this.setGMZoomPercent(percent);
    }

    async adjustZoomByPercent(percentChange) {
        // Przekierowanie na GM zoom dla kompatybilności
        await this.adjustGMZoomByPercent(percentChange);
    }

    updateZoomInput() {
        const zoomInput = document.getElementById('zoomInput');
        if (zoomInput) {
            zoomInput.value = Math.round(this.viewer.zoom * 100);
        }
    }

    updateZoomDisplay() {
        if (this.viewer.zoomLevel) {
            // zoomLevel input pokazuje zoom podglądu, nie GM-a
            const previewZoom = this.viewer.previewZoom || 100;
            if (this.viewer.zoomLevel.tagName === 'INPUT') {
                // Nowy edytowalny input - pokaż zoom podglądu
                this.viewer.zoomLevel.value = previewZoom;
            } else {
                // Stary div (dla kompatybilności)
                this.viewer.zoomLevel.textContent = `${previewZoom}%`;
            }
        }
        // NIE wywołuj updateZoomInput() - to jest dla GM zoom
    }

    // Funkcje nawigacji - NAPRAWIONE: uwzględnianie obrotu mapy GM
    navigate(direction) {
        console.log('🧭 Navigate wywołane:', direction, 'remotePreviewControl:', this.viewer.remotePreviewControl);
        console.log('🧭 Obrót mapy GM:', this.viewer.rotation + '°');

        // Navigation-controls sterują TYLKO podglądem, ale muszą uwzględnić obrót mapy GM
        if (this.viewer.remotePreviewControl) {
            // MAPOWANIE KIERUNKÓW zgodnie z obrotem mapy GM
            let actualDirection = direction;

            if (this.viewer.rotation === 90) {
                // Obrót 90°: up→right, down→left, left→up, right→down
                if (direction === 'up') actualDirection = 'right';
                else if (direction === 'down') actualDirection = 'left';
                else if (direction === 'left') actualDirection = 'up';
                else if (direction === 'right') actualDirection = 'down';
            } else if (this.viewer.rotation === 180) {
                // Obrót 180°: up→down, down→up, left→right, right→left
                if (direction === 'up') actualDirection = 'down';
                else if (direction === 'down') actualDirection = 'up';
                else if (direction === 'left') actualDirection = 'right';
                else if (direction === 'right') actualDirection = 'left';
            } else if (this.viewer.rotation === 270) {
                // Obrót 270°: up→left, down→right, left→down, right→up
                if (direction === 'up') actualDirection = 'left';
                else if (direction === 'down') actualDirection = 'right';
                else if (direction === 'left') actualDirection = 'down';
                else if (direction === 'right') actualDirection = 'up';
            }
            // 0° - bez zmian kierunku

            console.log(`📍 Mapowanie kierunku: ${direction} → ${actualDirection} (obrót ${this.viewer.rotation}°)`);
            console.log('📡 Wysyłanie komendy nawigacji do podglądu:', { action: 'pan', direction: actualDirection });

            fetch('/api/preview-map/navigation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'pan', direction: actualDirection })
            }).catch((err) => {
                console.error('❌ Błąd wysyłania komendy nawigacji:', err);
            });
            setTimeout(() => this.fetchPreviewViewport(), 150);
        } else {
            console.log('⚠️ remotePreviewControl = false, komenda nawigacji nie została wysłana');
        }

        this.reportCurrentViewport();
    }

    // Wyśrodkowanie podglądu
    centerView() {
        console.log('🎯 centerView() wywołane - centrowanie podglądu');

        if (this.viewer.remotePreviewControl) {
            console.log('📡 Wysyłanie komendy center do podglądu');
            fetch('/api/preview-map/navigation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'center' })
            }).catch((err) => {
                console.error('❌ Błąd wysyłania komendy center:', err);
            });
            setTimeout(() => this.fetchPreviewViewport(), 150);
        } else {
            console.log('⚠️ remotePreviewControl = false, komenda center nie została wysłana');
        }

        this.reportCurrentViewport();
    }


    computeViewportFromTransform() {
        if (!this.viewer.currentMap) return null;
        const cw = this.viewer.mapContainer.clientWidth;
        const ch = this.viewer.mapContainer.clientHeight;
        const mw = this.viewer.currentMap.width;
        const mh = this.viewer.currentMap.height;
        // Ignorujemy rotację dla wyliczenia prostokąta – rotacja przesyłana osobno
        const x = Math.max(0, -this.viewer.panOffset.x / this.viewer.zoom);
        const y = Math.max(0, -this.viewer.panOffset.y / this.viewer.zoom);
        const w = Math.min(cw / this.viewer.zoom, mw - x);
        const h = Math.min(ch / this.viewer.zoom, mh - y);
        return { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) };
    }

    computeViewportCorners() {
        if (!this.viewer.currentMap) return null;
        const cw = this.viewer.mapContainer.clientWidth;
        const ch = this.viewer.mapContainer.clientHeight;
        const imageWidth = this.viewer.currentMap.width;
        const imageHeight = this.viewer.currentMap.height;
        const originX = cw / 2; // transform-origin w GM jest centrum kontenera
        const originY = ch / 2;
        const panX = this.viewer.panOffset.x;
        const panY = this.viewer.panOffset.y;
        const zoom = this.viewer.zoom;
        // Użyj całkowitego obrotu pokazywanego w preview
        const totalRotation = (this.viewer.rotation + (this.viewer.previewRotation || 0)) % 360;

        const screenToImage = (sx, sy) => {
            let x = sx; let y = sy;
            // Przesuń do środka
            x -= originX; y -= originY;
            // Odwróć translate
            x -= panX; y -= panY;
            // Odwróć rotate z uwzględnieniem dodatkowego obrotu podglądu
            if (totalRotation !== 0) {
                const angle = -totalRotation * Math.PI / 180;
                const cos = Math.cos(angle); const sin = Math.sin(angle);
                const rx = x * cos - y * sin; const ry = x * sin + y * cos;
                x = rx; y = ry;
            }
            // Odwróć scale
            x /= zoom; y /= zoom;
            // Powrót od środka
            x += originX; y += originY;
            return { x, y };
        };

        const tl = screenToImage(0, 0);
        const tr = screenToImage(cw, 0);
        const br = screenToImage(cw, ch);
        const bl = screenToImage(0, ch);

        const clip = p => ({
            x: Math.max(0, Math.min(p.x, imageWidth)),
            y: Math.max(0, Math.min(p.y, imageHeight))
        });
        return [clip(tl), clip(tr), clip(br), clip(bl)];
    }

    // Raportuj aktualny viewport GM do serwera - NAPRAWIONE OBLICZENIA
    reportCurrentViewport() {
        if (!this.viewer.currentMap) return;

        // Guard przeciwko infinite loop
        if (this._reportInProgress) return;
        this._reportInProgress = true;

        try {
            const containerWidth = this.viewer.mapContainer.clientWidth;
            const containerHeight = this.viewer.mapContainer.clientHeight;
            const imageWidth = this.viewer.currentMap.width;
            const imageHeight = this.viewer.currentMap.height;
            const vp = this.computeViewportFromTransform();
            if (!vp) return;

            const viewport = {
                x: vp.x,
                y: vp.y,
                width: vp.width,
                height: vp.height,
                zoom: this.viewer.zoom,
                rotation: this.viewer.rotation,
                mapWidth: imageWidth,
                mapHeight: imageHeight,
                panX: this.viewer.panOffset.x,
                panY: this.viewer.panOffset.y,
                containerWidth,
                containerHeight
            };

            // Wyślij dane tylko jeśli potrzebne dla podglądu (zachowano, ale bez oczekiwania na odpowiedź)
            fetch('/api/preview-map/viewport', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(viewport)
            }).catch(() => {});

            // Natychmiastowe lokalne odświeżenie ramki
            this.drawViewportOverlay(viewport);
        } finally {
            this._reportInProgress = false;
        }
    }

    // Funkcje obrotu mapy
    rotateMap(degrees) {
        this.viewer.rotation = (this.viewer.rotation + degrees + 360) % 360;
        if (this.viewer.remotePreviewControl) {
            // Wyślij obrót do podglądu
            fetch('/api/preview-map/navigation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'rotate', rotation: this.viewer.rotation })
            }).catch(()=>{});
            // Szybki fallback pobrania viewportu po obrocie
            setTimeout(() => this.fetchPreviewViewport(), 150);
        }
        this.clampPan();
        this.updateRotationDisplay();
        this.viewer.applyTransform();
        this.viewer.drawCharacters();
        console.log('🎯 ViewportManager.rotate() wywołuje saveMapSettings()');
        this.viewer.saveMapSettings(); // Tylko settings, nie nadpisuj całego pliku
        this.reportCurrentViewport();
    }

    resetRotation() {
        this.viewer.rotation = 0;
        if (this.viewer.remotePreviewControl) {
            fetch('/api/preview-map/navigation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'rotate', rotation: 0 })
            }).catch(()=>{});
            setTimeout(() => this.fetchPreviewViewport(), 150);
        }
        this.clampPan();
        this.updateRotationDisplay();
        this.viewer.applyTransform();
        this.viewer.drawCharacters();
        console.log('🎯 ViewportManager.resetRotation() wywołuje saveMapSettings()');
        this.viewer.saveMapSettings(); // Tylko settings, nie nadpisuj całego pliku
        this.reportCurrentViewport();
    }

    updateRotationDisplay() {
        if (this.viewer.rotationValue) {
            this.viewer.rotationValue.textContent = `${this.viewer.rotation}°`;
        }
    }

    sendRotationToPreview() {
        const command = {
            action: 'rotate',
            rotation: this.viewer.rotation
        };
        fetch('/api/preview-map/navigation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command)
        }).catch(err => console.error('Error sending rotation command:', err));
    }

    // Funkcja do obracania tylko podglądu (bez obracania mapy na index)
    rotatePreview() {
        // Zwiększ dodatkowy obrót tylko dla podglądu
        this.viewer.previewRotation = (this.viewer.previewRotation + 90) % 360;
        // Odśwież ramkę lokalnie bez wysyłania obrotu jako rotacja mapy
        this.reportCurrentViewport();
    }

    // Obsługa viewport podglądu - WYŁĄCZONE automatyczne odświeżanie
    startViewportPolling() {
        if (this.viewer.viewportPollingInterval) {
            clearInterval(this.viewer.viewportPollingInterval);
        }
        // Brak automatycznego odświeżania – sterowanie ręczne (przyciski / zoom / rotacja)
    }

    startPreviewViewportPolling(interval = 300) {
        if (this.previewViewportPollingInterval) clearInterval(this.previewViewportPollingInterval);
        this.previewViewportPollingInterval = setInterval(() => this.fetchPreviewViewport(), interval);
    }

    async fetchPreviewViewport() {
        try {
            console.log('🔍 GM: fetchPreviewViewport() - pobieranie danych z /api/preview-map/viewport');

            // Debug: rozmiary kontenera GM dla porównania
            const gmContainerWidth = this.viewer.mapContainer?.clientWidth || 0;
            const gmContainerHeight = this.viewer.mapContainer?.clientHeight || 0;
            console.log(`📏 GM Container rozmiary: ${gmContainerWidth}x${gmContainerHeight}`);

            const res = await fetch('/api/preview-map/viewport');
            if (!res.ok) {
                console.warn('⚠️ GM: fetchPreviewViewport failed, status:', res.status);
                return;
            }
            const data = await res.json();
            console.log('📥 GM: Otrzymano viewport z serwera:', {
                x: data.x, y: data.y, width: data.width, height: data.height,
                zoom: data.zoom, rotation: data.rotation,
                podgladContainer: `${data.containerWidth}x${data.containerHeight}` // z podglądu
            });

            // Porównaj rozmiary kontenerów
            if (data.containerWidth && data.containerHeight) {
                console.log('📊 PORÓWNANIE kontenerów:');
                console.log(`   GM: ${gmContainerWidth}x${gmContainerHeight}`);
                console.log(`   Podgląd: ${data.containerWidth}x${data.containerHeight}`);

                if (gmContainerWidth !== data.containerWidth || gmContainerHeight !== data.containerHeight) {
                    console.warn('⚠️ RÓŻNE ROZMIARY KONTENERÓW - to może być przyczyna problemu!');
                }
            }

            // Oczekiwane pola: x,y,width,height,zoom,rotation,mapWidth,mapHeight
            if (data && typeof data.x === 'number' && typeof data.y === 'number' && typeof data.width === 'number') {
                console.log('✅ GM: Dane viewport są poprawne, zapisuję do serverViewport');
                this.serverViewport = data;
                this.drawServerViewportOverlay();
            } else {
                console.warn('⚠️ GM: Dane viewport są nieprawidłowe:', data);
            }
        } catch (e) {
            // Ignoruj gdy podgląd nie ustawiony
            console.log('⚪ GM: fetchPreviewViewport error (prawdopodobnie brak podglądu):', e.message);
        }
    }

    drawViewportOverlay(vp) {
        // AGRESYWNE UKRYCIE VIEWPORT - wielopoziomowe ukrywanie ramki
        if (this.viewer.viewportOverlayCanvas) {
            this.viewer.viewportOverlayCanvas.style.opacity = '0';
            this.viewer.viewportOverlayCanvas.style.visibility = 'hidden';
            this.viewer.viewportOverlayCanvas.style.display = 'none';
            this.viewer.viewportOverlayCanvas.style.pointerEvents = 'none';
            console.log('🔍 Viewport overlay ukryty (opacity=0, visibility=hidden, display=none)');
        }
        return;
    }

    async drawPreviewViewport() {
        if (!this.viewer.currentMap) return;
        const vp = this.computeViewportFromTransform();
        if (!vp) return;
        this.drawViewportOverlay(vp);
    }


    // Debug - funkcje do pokazywania/ukrywania viewport
    showViewport() {
        if (this.viewer.viewportOverlayCanvas) {
            this.viewer.viewportOverlayCanvas.style.opacity = '0.8';
            this.viewer.viewportOverlayCanvas.style.visibility = 'visible';
            this.viewer.viewportOverlayCanvas.style.display = 'block';
            this.viewer.viewportOverlayCanvas.style.pointerEvents = 'auto';
            console.log('🔍 Viewport overlay pokazany (opacity=0.8, visible)');
        }
    }

    hideViewport() {
        if (this.viewer.viewportOverlayCanvas) {
            this.viewer.viewportOverlayCanvas.style.opacity = '0';
            this.viewer.viewportOverlayCanvas.style.visibility = 'hidden';
            this.viewer.viewportOverlayCanvas.style.display = 'none';
            this.viewer.viewportOverlayCanvas.style.pointerEvents = 'none';
            console.log('🔍 Viewport overlay ukryty (opacity=0, hidden, none)');
        }
    }

    // Debug - test mapowania kierunków dla różnych obrotów
    testNavigationMapping() {
        console.log('🧪 TEST NAVIGATION MAPPING: Test mapowania kierunków dla obrotu', this.viewer.rotation + '°');

        const directions = ['up', 'down', 'left', 'right'];

        directions.forEach(dir => {
            let actualDirection = dir;

            if (this.viewer.rotation === 90) {
                if (dir === 'up') actualDirection = 'right';
                else if (dir === 'down') actualDirection = 'left';
                else if (dir === 'left') actualDirection = 'up';
                else if (dir === 'right') actualDirection = 'down';
            } else if (this.viewer.rotation === 180) {
                if (dir === 'up') actualDirection = 'down';
                else if (dir === 'down') actualDirection = 'up';
                else if (dir === 'left') actualDirection = 'right';
                else if (dir === 'right') actualDirection = 'left';
            } else if (this.viewer.rotation === 270) {
                if (dir === 'up') actualDirection = 'left';
                else if (dir === 'down') actualDirection = 'right';
                else if (dir === 'left') actualDirection = 'down';
                else if (dir === 'right') actualDirection = 'up';
            }

            console.log(`   ${dir.toUpperCase()} → ${actualDirection.toUpperCase()}`);
        });

        console.log('\n🧪 SPRAWDŹ: Czy te mapowania są poprawne dla obrotu ' + this.viewer.rotation + '°?');
        console.log('   - Przycisk UP powinien przesuwać w kierunku "góry" obróconeji mapy');
        console.log('   - Przycisk RIGHT powinien przesuwać w kierunku "prawa" obróconeji mapy');
    }
}

// Debug - sprawdź czy klasa jest dostępna
console.log('✅ ViewportManager class loaded');
console.log('ViewportManager typeof:', typeof ViewportManager);
console.log('ViewportManager is function:', typeof ViewportManager === 'function');

// Sprawdź czy ViewportManager ma potrzebne metody
if (typeof ViewportManager === 'function') {
    const prototype = ViewportManager.prototype;
    const requiredMethods = ['updateZoomDisplay', 'reportCurrentViewport', 'setGMZoomPercent'];
    const missingMethods = requiredMethods.filter(method => typeof prototype[method] !== 'function');

    if (missingMethods.length > 0) {
        console.error('❌ ViewportManager brakuje metod:', missingMethods);
    } else {
        console.log('✅ ViewportManager ma wszystkie wymagane metody');
    }
}

// RÓŻNE METODY EKSPORTU - sprawdźmy która zadziała
try {
    window.ViewportManager = ViewportManager;
    console.log('✅ window.ViewportManager assigned successfully');
    console.log('window.ViewportManager type:', typeof window.ViewportManager);

    // Sprawdź czy przypisanie faktycznie zadziałało
    if (window.ViewportManager && typeof window.ViewportManager === 'function') {
        console.log('✅ window.ViewportManager verification successful');

        // Test tworzenia instancji (bez wykonywania)
        const testConstructor = window.ViewportManager.toString();
        if (testConstructor.includes('constructor')) {
            console.log('✅ ViewportManager konstruktor dostępny');
        }
    } else {
        throw new Error('ViewportManager assignment failed verification');
    }

} catch (e) {
    console.error('❌ Failed to assign window.ViewportManager:', e);
    console.log('🔄 Próbuję alternatywne metody eksportu...');
}

// Alternatywny eksport
try {
    if (typeof window !== 'undefined') {
        window['ViewportManager'] = ViewportManager;
        console.log('✅ Alternative window[ViewportManager] assigned');
    }
} catch (e) {
    console.error('❌ Alternative export failed:', e);
}

// Globalny eksport
try {
    globalThis.ViewportManager = ViewportManager;
    console.log('✅ globalThis.ViewportManager assigned');
} catch (e) {
    console.error('❌ globalThis export failed:', e);
}

// Test czy ViewportManager jest faktycznie funkcją konstruktora
console.log('ViewportManager is function:', typeof ViewportManager === 'function');
console.log('ViewportManager is class:', ViewportManager.toString().startsWith('class'));

// Eksport dla innych modułów
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ViewportManager;
}

console.log('🏁 VIEWPORT.JS - KONIEC PLIKU - ViewportManager dostępny:', typeof ViewportManager);

