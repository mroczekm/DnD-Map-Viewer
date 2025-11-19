// podglad.js - Manager dla strony podglądu
class PodgladManager {
    constructor() {
        // Podstawowe właściwości
        this.mapContainer = null;
        this.mapImage = null;
        this.fogCanvas = null;
        this.fogCtx = null;
        this.gridCanvas = null;
        this.gridCtx = null;
        this.charactersLayer = null;
        this.charactersCtx = null;
        this.previewMapName = null;
        this.mapInfo = null;
        this.pollingInterval = null;
        this.animationFrame = null;

        // Stan mapy
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1;
        this.rotation = 0;

        // Dane aplikacji
        this.fogState = null;
        this.gridSize = null;
        this.gridOffsetX = 0;
        this.gridOffsetY = 0;
        this.characters = { players: [], enemies: [] };
        this.playerColor = '#00ff00';
        this.enemyColor = '#ff0000';

        // Interwały pollingu
        this.previewMapPollingInterval = null;
        this.animationTime = 0;

        // Liczniki do śledzenia zmian (dla zmniejszenia logowania)
        this.lastFogCount = -1;
        this.lastPlayersCount = -1;
        this.lastEnemiesCount = -1;

        // Kontrola ramki viewport
        this.viewportFrameEnabled = false;
    }

    // Inicjalizacja elementów DOM
    initElements() {
        this.mapContainer = document.getElementById('mapContainer');
        this.mapImage = document.getElementById('mapImage');
        this.fogCanvas = document.getElementById('fogLayer');  // W HTML nazywa się fogLayer
        this.gridCanvas = null;  // Nie ma gridCanvas w podglądzie
        this.charactersLayer = document.getElementById('charactersLayer');

        if (this.fogCanvas) this.fogCtx = this.fogCanvas.getContext('2d');
        if (this.gridCanvas) this.gridCtx = this.gridCanvas.getContext('2d');
        if (this.charactersLayer) this.charactersCtx = this.charactersLayer.getContext('2d');
    }

    // Inicjalizacja event listenerów
    initEvents() {
        window.addEventListener('resize', () => {
            this.updateTransform();
        });

        if (this.mapImage) {
            this.mapImage.addEventListener('load', () => {
                this.updateTransform();
                // Nie wywołujemy renderFog tutaj - zostanie wywołane przez fetchFogState
            });
        }
    }

    // Aktualizacja transformacji mapy - zgodnie z systemem GM
    updateTransform() {
        if (!this.mapImage || !this.mapContainer) {
            return;
        }
        if (!this.mapImage.complete || this.mapImage.naturalWidth === 0) {
            return;
        }

        // Obliczenia takie same jak w GM
        const cw = this.mapContainer.clientWidth;
        const ch = this.mapContainer.clientHeight;
        const mw = this.mapImage.naturalWidth;
        const mh = this.mapImage.naturalHeight;

        if (!cw || !ch || !mw || !mh) {
            return;
        }

        // Pozycjonowanie wrappera na środku kontenera (jak w GM)
        const wrapperLeft = (cw - mw) / 2;
        const wrapperTop = (ch - mh) / 2;
        const originX = cw / 2 - wrapperLeft;
        const originY = ch / 2 - wrapperTop;

        // Znajdź mapWrapper (to powinien być rodzic mapImage)
        const mapWrapper = document.getElementById('mapWrapper');
        if (!mapWrapper) {
            console.error('UpdateTransform: Nie znaleziono mapWrapper!');
            return;
        }

        // Ustaw pozycję i rozmiar wrappera
        mapWrapper.style.position = 'absolute';
        mapWrapper.style.left = wrapperLeft + 'px';
        mapWrapper.style.top = wrapperTop + 'px';
        mapWrapper.style.width = mw + 'px';
        mapWrapper.style.height = mh + 'px';

        // Ustaw transform-origin na centrum kontenera (jak w GM)
        mapWrapper.style.transformOrigin = `${originX}px ${originY}px`;

        // Kolejność transformacji jak w GM: translate -> scale -> rotate
        let transform = `translate(${this.panX}px, ${this.panY}px)`;
        transform += ` scale(${this.zoom})`;
        if (this.rotation !== 0) {
            transform += ` rotate(${this.rotation}deg)`;
        }

        mapWrapper.style.transform = transform;

        // Ustaw rozmiary canvas-ów jeśli mapa jest załadowana
        if (this.fogCanvas && this.fogCanvas.width !== mw) {
            this.fogCanvas.width = mw;
            this.fogCanvas.height = mh;
        }

        if (this.charactersLayer && this.charactersLayer.width !== mw) {
            this.charactersLayer.width = mw;
            this.charactersLayer.height = mh;
        }
    }

    // Pobieranie nazwy mapy podglądu
    async fetchPreviewMapName() {
        try {
            const response = await fetch('/api/preview-map');
            if (response.ok) {
                this.previewMapName = await response.text();
            }
        } catch (err) {
            // Silent fail - serwer może być niedostępny
        }
    }

    // Polling nazwy mapy gdy nie jest ustawiona
    startPreviewMapPolling() {
        const pollInterval = setInterval(async () => {
            await this.fetchPreviewMapName();
            if (this.previewMapName) {
                clearInterval(pollInterval);
                await this.initializePreviewData();
            }
        }, 1000);
    }

    // Podstawowe funkcje fetch (placeholder)
    async fetchMapInfo() {
        if (!this.previewMapName) return;

        try {
            const response = await fetch(`/api/maps/${this.previewMapName}`);
            if (response.ok) {
                this.mapInfo = await response.json();

                // Upewnij się, że mapa jest widoczna (reset po poprzednich eksperymentach)
                this.mapImage.style.opacity = '1';
                this.mapImage.style.transition = '';

                this.mapImage.src = `/api/map-files/${this.mapInfo.filename}`;

                return new Promise((resolve) => {
                    this.mapImage.onload = () => {
                        // Nie resetuj ustawień tutaj - zostaną pobrane z fetchMapSettings
                        this.updateTransform();
                        resolve();
                    };
                });
            }
        } catch (error) {
            console.error('Error fetching map info:', error);
        }
    }

    async fetchGridConfig() {
        if (!this.previewMapName) return;

        try {
            const response = await fetch(`/api/grid-configs/${this.previewMapName}`);
            if (response.ok) {
                const config = await response.json();
                this.gridSize = config.gridSize;
                this.gridOffsetX = config.offsetX || 0;
                this.gridOffsetY = config.offsetY || 0;
            }
        } catch (error) {
            console.error('Error fetching grid config:', error);
            this.gridSize = null;
        }
    }

    // Sprawdź czy ramka viewport jest włączona
    async checkViewportFrameStatus() {
        try {
            const response = await fetch('/api/preview-map/status');
            if (response.ok) {
                const status = await response.json();
                this.viewportFrameEnabled = status.viewportFrameEnabled || false;
            }
        } catch (error) {
            this.viewportFrameEnabled = false;
        }
    }

    async fetchMapSettings() {
        if (!this.previewMapName) {
            return;
        }

        try {
            const response = await fetch(`/api/settings/${this.previewMapName}`);

            if (response.ok) {
                const settings = await response.json();

                // Ustaw początkowe ustawienia zgodnie z GM
                // Obsługa różnych struktur danych z backendu
                if (settings.panOffset) {
                    // Nowa struktura z panOffset obiektem
                    this.panX = settings.panOffset.x || 0;
                    this.panY = settings.panOffset.y || 0;
                } else {
                    // Stara struktura z bezpośrednimi właściwościami
                    this.panX = settings.panX || 0;
                    this.panY = settings.panY || 0;
                }

                this.zoom = settings.zoom || 1;
                this.rotation = settings.rotation || 0;

                // Zastosuj transformację po załadowaniu ustawień
                this.updateTransform();
            } else if (response.status === 404) {
                // Zostaw domyślne wartości (0, 0, 1, 0)
                this.updateTransform();
            }
        } catch (error) {
            console.error('Error fetching map settings:', error);
            // Zostaw domyślne wartości
            this.updateTransform();
        }
    }

    async fetchFogState() {
        if (!this.previewMapName) return;

        try {
            const response = await fetch(`/api/fog/${this.previewMapName}`);

            if (response.ok) {
                this.fogState = await response.json();
                this.renderFog();
            }
        } catch (error) {
            // Silent fail
        }
    }

    async fetchCharacters() {
        if (!this.previewMapName) return;

        try {
            const response = await fetch(`/api/characters/${this.previewMapName}`);

            if (response.ok) {
                const data = await response.json();

                // Defensywne parsowanie struktury danych
                if (data.characters) {
                    this.characters = data.characters;
                } else if (data.players || data.enemies) {
                    this.characters = data;
                } else {
                    this.characters = { players: [], enemies: [] };
                }

                this.drawCharacters();
            }
        } catch (error) {
            // Silent fail
        }
    }

    // Polling komend nawigacji
    pollNavigationCommands() {
        setInterval(() => {
            fetch('/api/preview-map/navigation')
                .then(response => response.json())
                .then(command => {
                    if (command && Object.keys(command).length > 0) {
                        this.handleNavigationCommand(command);
                    }
                })
                .catch(err => {
                    // Silent fail
                });
        }, 100);
    }

    // Obsługa poleceń nawigacji
    handleNavigationCommand(command) {

        if (!command || typeof command !== 'object') {
            console.log('⚠️ Nieprawidłowa komenda nawigacji:', command);
            return;
        }

        try {
            // Destrukturyzacja z wartościami domyślnymi - eliminuje ReferenceError
            const { action = '', direction = '', step = 5, value, rotation } = command;


            switch(action) {
                case 'pan':
                    const panStep = 100;
                    console.log(`🧭 OTRZYMANO KOMENDĘ PAN: direction="${direction}", mapRotation=${this.rotation}°`);

                    // POPRAWKA KIERUNKÓW na podstawie obserwacji:
                    // Obserwacja: "w prawo → widok w dół", "w dół → widok w lewo"
                    // Znaczy że kierunki są przesunięte o 90° w lewo względem oczekiwanych
                    let actualPanX = 0;
                    let actualPanY = 0;

                    if (this.rotation === 270) {
                        // NAPRAWIONE mapowanie - lewo/prawo OK, naprawa góra/dół
                        if (direction === 'up') actualPanX -= panStep;      // up → dół (odwrócone)
                        else if (direction === 'down') actualPanX += panStep;   // down → góra (odwrócone)
                        else if (direction === 'left') actualPanY += panStep;   // left → prawo ✅
                        else if (direction === 'right') actualPanY -= panStep;  // right → lewo ✅
                    } else if (this.rotation === 90) {
                        // Obrót 90° - inne mapowanie
                        if (direction === 'up') actualPanX += panStep;
                        else if (direction === 'down') actualPanX -= panStep;
                        else if (direction === 'left') actualPanY -= panStep;
                        else if (direction === 'right') actualPanY += panStep;
                    } else if (this.rotation === 180) {
                        // Obrót 180° - odwrócone
                        if (direction === 'up') actualPanY -= panStep;
                        else if (direction === 'down') actualPanY += panStep;
                        else if (direction === 'left') actualPanX -= panStep;
                        else if (direction === 'right') actualPanX += panStep;
                    } else {
                        // Bez obrotu (0°) - standardowe kierunki
                        if (direction === 'up') actualPanY += panStep;
                        else if (direction === 'down') actualPanY -= panStep;
                        else if (direction === 'left') actualPanX += panStep;
                        else if (direction === 'right') actualPanX -= panStep;
                    }

                    this.panX += actualPanX;
                    this.panY += actualPanY;

                    console.log(`📍 POPRAWKA: ${direction} → ΔX=${actualPanX}, ΔY=${actualPanY} (rotation=${this.rotation}°)`);
                    console.log(`📍 Nowa pozycja pan: (${this.panX}, ${this.panY})`);

                    this.updateTransform();
                    break;
                case 'zoom':
                    const zoomStep = step || 1;
                    if (direction === 'in') {
                        const currentPercent = Math.round(this.zoom * 100);
                        const newPercent = Math.min(currentPercent + zoomStep, 500);
                        this.zoom = newPercent / 100;
                    } else if (direction === 'out') {
                        const currentPercent = Math.round(this.zoom * 100);
                        const newPercent = Math.max(currentPercent - zoomStep, 10);
                        this.zoom = newPercent / 100;
                    } else if (direction === 'set' && value) {
                        this.zoom = value;
                    }
                    this.updateTransform();
                    break;
                case 'rotate':
                    const rotationValue = typeof rotation === 'string' ? parseFloat(rotation) : rotation;
                    if (typeof rotationValue === 'number' && !isNaN(rotationValue)) {
                        this.rotation = rotationValue;
                        this.updateTransform();
                        // Przerenuj postacie z nowym obrotem
                        this.drawCharacters();
                    }
                    break;
                case 'rotatePreview':
                    const degrees = command.degrees || 90;
                    this.rotation = (this.rotation + degrees + 360) % 360;
                    console.log('🔄 Obrót podglądu:', this.rotation + '°');
                    this.updateTransform();
                    // Przerenuj postacie z nowym obrotem
                    this.drawCharacters();
                    break;
                case 'center':
                    this.panX = 0;
                    this.panY = 0;
                    this.updateTransform();
                    break;
                case 'reload-page':
                    console.log('RELOAD-PAGE: Przeładowuję stronę podglądu...');

                    // AGRESYWNE PRZEŁADOWANIE - kilka metod jednocześnie
                    try {
                        // Zatrzymaj wszystkie interwały żeby nie przeszkadzały
                        if (this.navigationPollingInterval) {
                            clearInterval(this.navigationPollingInterval);
                        }

                        // Metoda 1: Natychmiastowe przeładowanie
                        window.location.reload(true);

                        // Metoda 2: Backup po 50ms
                        setTimeout(() => {
                            window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
                        }, 50);

                        // Metoda 3: Agresywny backup po 100ms
                        setTimeout(() => {
                            document.location.replace(window.location.href.split('?')[0] + '?refresh=' + Date.now());
                        }, 100);

                        // Metoda 4: Ostateczny fallback po 200ms
                        setTimeout(() => {
                            window.history.go(0);
                        }, 200);

                        // Metoda 5: Nuclear option po 300ms
                        setTimeout(() => {
                            const newWindow = window.open(window.location.href.split('?')[0], '_self');
                            if (newWindow) {
                                newWindow.location.reload(true);
                            }
                        }, 300);

                    } catch (reloadError) {
                        console.error('Błąd podczas przeładowania:', reloadError);
                        // Emergency fallback
                        alert('🔄 Przeładowanie automatyczne nie powiodło się. Odśwież stronę ręcznie (F5)');
                    }

                    // Ważne: zwróć z funkcji żeby nie wykonywać dalszego kodu
                    return;

                default:
                    console.warn(`⚠️ NIEOBSŁUŻONA AKCJA: "${action}" (typu ${typeof action})`);
                    console.warn('📋 Pełna komenda:', command);
                    console.warn('📋 Dostępne akcje: pan, zoom, rotate, rotatePreview, center, reload-page');
                    break;
            }
        } catch (error) {
            console.error('❌ Błąd w handleNavigationCommand:', error, 'Komenda:', command);
        }
    }


    // Raportowanie viewport do serwera - WŁĄCZONE ale ramka ukryta w GM
    reportViewport() {
        // Nie wysyłaj viewport jeśli ramka nie jest włączona
        if (!this.viewportFrameEnabled) return;

        if (!this.mapImage || !this.mapImage.complete || !this.previewMapName) return;

        const cw = this.mapContainer.clientWidth;
        const ch = this.mapContainer.clientHeight;
        const imageWidth = this.mapImage.naturalWidth;
        const imageHeight = this.mapImage.naturalHeight;

        if (!cw || !ch || !imageWidth || !imageHeight) return;

        // NOWA LOGIKA: Identyczna z GM computeViewportFromTransform()
        // Ignoruj rotację dla obliczenia prostokąta - rotacja przesyłana osobno
        const x = Math.max(0, -this.panX / this.zoom);
        const y = Math.max(0, -this.panY / this.zoom);

        // NAPRAWIONE: Używaj faktycznych rozmiarów widocznego obszaru w przestrzeni mapy
        // a nie rozmiarów kontenera podglądu
        let effectiveViewportWidth, effectiveViewportHeight;

        // Oblicz faktyczne rozmiary viewport w przestrzeni mapy uwzględniając różne rozmiary kontenerów
        if (this.rotation === 90 || this.rotation === 270) {
            // Przy obrocie 90°/270° wysokość staje się szerokością
            effectiveViewportWidth = ch / this.zoom;
            effectiveViewportHeight = cw / this.zoom;
        } else {
            // Przy obrocie 0°/180° rozmiary bez zmian
            effectiveViewportWidth = cw / this.zoom;
            effectiveViewportHeight = ch / this.zoom;
        }

        // Ogranicz do granic obrazu
        const w = Math.min(effectiveViewportWidth, imageWidth - x);
        const h = Math.min(effectiveViewportHeight, imageHeight - y);

        const viewport = {
            x: Math.round(x),
            y: Math.round(y),
            width: Math.round(w),
            height: Math.round(h),
            zoom: this.zoom,
            rotation: this.rotation,
            mapWidth: imageWidth,
            mapHeight: imageHeight,
            panX: this.panX,
            panY: this.panY,
            containerWidth: cw,
            containerHeight: ch
        };

        fetch('/api/preview-map/viewport', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(viewport)
        }).catch(err => {
            console.error('Error sending viewport data:', err);
        });
    }

    // Renderowanie mgły z animacją i kwadratowymi obszarami
    renderFog() {
        if (!this.fogCtx || !this.mapImage) return;

        // Ustaw rozmiar canvas do rozmiaru mapy
        const expectedWidth = this.mapImage.naturalWidth;
        const expectedHeight = this.mapImage.naturalHeight;

        if (this.fogCanvas.width !== expectedWidth || this.fogCanvas.height !== expectedHeight) {
            this.fogCanvas.width = expectedWidth;
            this.fogCanvas.height = expectedHeight;
        }

        // Wyczyść canvas
        this.fogCtx.clearRect(0, 0, this.fogCanvas.width, this.fogCanvas.height);

        if (!this.fogState || !this.fogState.revealedAreas) {
            // Pełna mgła - nieprzezroczysta z animowaną teksturą
            this.drawAnimatedFog();
            return;
        }

        // Rysuj animowaną mgłę na całej mapie
        this.drawAnimatedFog();

        // Wytnij kwadratowe obszary odsłoniętej mgły
        this.fogCtx.globalCompositeOperation = 'destination-out';
        this.fogState.revealedAreas.forEach(area => {
            if (area.isGridCell) {
                // Kwadratowy obszar dla komórek siatki
                const size = area.radius * 2; // radius to połowa rozmiaru kwadrata
                this.fogCtx.fillRect(area.x - area.radius, area.y - area.radius, size, size);
            } else {
                // Okrągły obszar dla dowolnych punktów
                this.fogCtx.beginPath();
                this.fogCtx.arc(area.x, area.y, area.radius, 0, 2 * Math.PI);
                this.fogCtx.fill();
            }
        });
        this.fogCtx.globalCompositeOperation = 'source-over';
    }

    // Animowana tekstura mgły jak w prawdziwej grze
    drawAnimatedFog() {
        const time = (this.animationTime || 0) / 1000;

        // Ciemnoszara, nieprzezroczysta mgła
        this.fogCtx.fillStyle = '#404040';
        this.fogCtx.fillRect(0, 0, this.fogCanvas.width, this.fogCanvas.height);

        // Dodaj animowaną teksturę mgły
        const imageData = this.fogCtx.getImageData(0, 0, this.fogCanvas.width, this.fogCanvas.height);
        const data = imageData.data;

        for (let y = 0; y < this.fogCanvas.height; y += 4) {
            for (let x = 0; x < this.fogCanvas.width; x += 4) {
                const noise = this.perlinNoise(x * 0.01, y * 0.01, time);
                const brightness = Math.floor(64 + noise * 32); // 64-96 zakres

                for (let dy = 0; dy < 4; dy++) {
                    for (let dx = 0; dx < 4; dx++) {
                        const px = x + dx;
                        const py = y + dy;
                        if (px < this.fogCanvas.width && py < this.fogCanvas.height) {
                            const index = (py * this.fogCanvas.width + px) * 4;
                            data[index] = brightness;     // R
                            data[index + 1] = brightness; // G
                            data[index + 2] = brightness; // B
                            data[index + 3] = 255;        // A - pełna nieprzezroczystość
                        }
                    }
                }
            }
        }

        this.fogCtx.putImageData(imageData, 0, 0);
    }

    // Szum Perlina dla animacji mgły
    perlinNoise(x, y, seed = 0) {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const fx = x - ix;
        const fy = y - iy;

        const u = fx * fx * (3 - 2 * fx);
        const v = fy * fy * (3 - 2 * fy);

        const a = Math.sin((ix + iy * 57 + seed) * 0.05) * Math.cos((ix * 37 + iy + seed) * 0.07);
        const b = Math.sin((ix + 1 + iy * 57 + seed) * 0.05) * Math.cos(((ix + 1) * 37 + iy + seed) * 0.07);
        const c = Math.sin((ix + (iy + 1) * 57 + seed) * 0.05) * Math.cos((ix * 37 + (iy + 1) + seed) * 0.07);
        const d = Math.sin((ix + 1 + (iy + 1) * 57 + seed) * 0.05) * Math.cos(((ix + 1) * 37 + (iy + 1) + seed) * 0.07);

        return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
    }

    // Rysowanie postaci dokładnie jak w GM
    drawCharacters() {
        if (!this.charactersCtx || !this.mapImage) return;
        if (!this.mapImage.complete || this.mapImage.naturalWidth === 0) return;

        // Ustaw rozmiar canvas do rozmiaru mapy
        const expectedWidth = this.mapImage.naturalWidth;
        const expectedHeight = this.mapImage.naturalHeight;

        if (this.charactersLayer.width !== expectedWidth || this.charactersLayer.height !== expectedHeight) {
            this.charactersLayer.width = expectedWidth;
            this.charactersLayer.height = expectedHeight;
        }

        this.charactersCtx.clearRect(0, 0, this.charactersLayer.width, this.charactersLayer.height);

        if (!this.characters || (!this.characters.players && !this.characters.enemies)) {
            return;
        }

        // Rysuj graczy (okręgi) jak w GM - półprzezroczyste z obramowaniem
        if (this.characters.players && this.characters.players.length > 0) {
            this.charactersCtx.strokeStyle = this.playerColor || '#00ff00';
            this.charactersCtx.fillStyle = (this.playerColor || '#00ff00') + '40'; // 25% opacity
            this.charactersCtx.lineWidth = 3;

            this.characters.players.forEach(player => {
                if (this.gridSize) {
                    // Z siatką
                    const centerX = player.x + this.gridSize / 2;
                    const centerY = player.y + this.gridSize / 2;
                    const radius = this.gridSize / 2 - 5;

                    this.charactersCtx.beginPath();
                    this.charactersCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                    this.charactersCtx.fill();
                    this.charactersCtx.stroke();
                } else {
                    // Bez siatki - standardowy rozmiar
                    this.charactersCtx.beginPath();
                    this.charactersCtx.arc(player.x, player.y, 15, 0, 2 * Math.PI);
                    this.charactersCtx.fill();
                    this.charactersCtx.stroke();
                }
            });
        }

        // Rysuj wrogów (litery) jak w GM - bez kwadratu, z rotacją
        if (this.characters.enemies && this.characters.enemies.length > 0) {
            this.charactersCtx.fillStyle = this.enemyColor || '#ff0000';

            if (this.gridSize) {
                this.charactersCtx.font = `bold ${this.gridSize * 0.6}px Arial`;
            } else {
                this.charactersCtx.font = 'bold 20px Arial';
            }

            this.charactersCtx.textAlign = 'center';
            this.charactersCtx.textBaseline = 'middle';

            this.characters.enemies.forEach(enemy => {
                if (this.gridSize) {
                    // Z siatką - dokładnie jak w GM
                    const centerX = enemy.x + this.gridSize / 2;
                    const centerY = enemy.y + this.gridSize / 2;

                    this.charactersCtx.save();

                    // Przesuń do środka litery
                    this.charactersCtx.translate(centerX, centerY);

                    // Obróć literę w PRZECIWNYM kierunku niż mapa, aby była zawsze czytelna
                    // Jeśli mapa obrócona o 90°, literka o -90° = czytelna
                    if (this.rotation !== 0) {
                        this.charactersCtx.rotate((-this.rotation * Math.PI) / 180);
                    }

                    // Narysuj literę w środku (0, 0)
                    this.charactersCtx.fillText(enemy.letter || '?', 0, 0);

                    this.charactersCtx.restore();
                } else {
                    // Bez siatki - standardowe
                    this.charactersCtx.save();
                    this.charactersCtx.translate(enemy.x, enemy.y);
                    if (this.rotation !== 0) {
                        this.charactersCtx.rotate((-this.rotation * Math.PI) / 180);
                    }
                    this.charactersCtx.fillText(enemy.letter || '?', 0, 0);
                    this.charactersCtx.restore();
                }
            });
        }
    }

    // Proste odświeżanie mgły
    startSimpleFogPolling() {
        setInterval(async () => {
            await this.fetchFogState();
        }, 2000);
    }

    // Rozpoczęcie pollingu postaci
    startPollingCharacters() {
        setInterval(() => {
            this.fetchCharacters();
        }, 2000);
    }

    // Animacja mgły
    animateFog() {
        this.animationTime = (this.animationTime || 0) + 16; // 60fps
        this.renderFog();
        this.animationFrame = requestAnimationFrame(() => this.animateFog());
    }

    // Rozpoczęcie animacji mgły
    startFogAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.animateFog();
    }

    // Zatrzymanie animacji mgły
    stopFogAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    // Raportowanie viewport - WŁĄCZONE ale ukryte w GM
    startViewportReporting() {
        // Szybkie raportowanie viewport co 500ms gdy ramka jest włączona
        setInterval(() => {
            if (this.viewportFrameEnabled) {
                this.reportViewport();
            }
        }, 500);
    }

    // Polling stanu ramki viewport - WŁĄCZONE ale ramka ukryta
    startViewportFramePolling() {
        // Sprawdzaj stan ramki co 3 sekundy
        setInterval(async () => {
            try {
                const response = await fetch('/api/preview-map/status');
                if (response.ok) {
                    const status = await response.json();
                    const newFrameState = status.viewportFrameEnabled || false;

                    if (newFrameState !== this.viewportFrameEnabled) {
                        this.viewportFrameEnabled = newFrameState;

                        if (this.viewportFrameEnabled) {
                            // Natychmiast wyślij viewport gdy ramka zostanie włączona
                            setTimeout(() => this.reportViewport(), 100);
                        }
                    }
                }
            } catch (error) {
                // Ignoruj błędy - serwer może być niedostępny
            }
        }, 3000);
    }


    // Inicjalizacja całej aplikacji
    async init() {
        this.initElements();
        this.initEvents();

        // Automatyczne polling mgły
        this.startSimpleFogPolling();

        // Spróbuj pobrać nazwę mapy raz
        await this.fetchPreviewMapName();

        if (this.previewMapName) {
            // Jeśli mapa już ustawiona – pełna inicjalizacja
            await this.initializePreviewData();
        } else {
            // Jeśli brak mapy – zacznij polling nazwy mapy
            this.startPreviewMapPolling();
        }
    }

    async initializePreviewData() {
        try {
            // Najpierw pobierz ustawienia żeby mieć prawidłowy zoom, pan i obrót
            await this.fetchMapSettings();
            await this.fetchMapInfo();
            await this.fetchGridConfig();
            await this.fetchFogState();
            await this.fetchCharacters();
            await this.checkViewportFrameStatus(); // WŁĄCZONE - sprawdź stan ramki


            // Rozpocznij animację mgły
            this.startFogAnimation();

            this.pollNavigationCommands();
            this.startPollingCharacters();
            this.startViewportReporting(); // WŁĄCZONE - ale ramka ukryta w GM
            this.startViewportFramePolling(); // WŁĄCZONE - polling stanu ramki


        } catch (error) {
            console.error('Error during preview data initialization:', error);
        }
    }
}

// INICJALIZACJA - uruchom PodgladManager po załadowaniu strony
let podgladManager;

window.addEventListener('load', async () => {
    try {
        podgladManager = new PodgladManager();
        await podgladManager.init();

        // Export globalny dla debugowania
        window.podgladManager = podgladManager;
    } catch (error) {
        console.error('Błąd inicjalizacji PodgladManager:', error);
    }
});

// Zatrzymanie animacji przy zamykaniu strony
window.addEventListener('beforeunload', () => {
    if (podgladManager) {
        podgladManager.stopFogAnimation();
    }
});

// Export dla możliwości importu w innych plikach
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PodgladManager;
}
