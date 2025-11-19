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

        console.log('🔍 Elementy DOM zainicjalizowane:', {
            mapContainer: !!this.mapContainer,
            mapImage: !!this.mapImage,
            fogCanvas: !!this.fogCanvas,
            charactersLayer: !!this.charactersLayer
        });
    }

    // Inicjalizacja event listenerów
    initEvents() {
        window.addEventListener('resize', () => {
            this.updateTransform();
        });

        if (this.mapImage) {
            this.mapImage.addEventListener('load', () => {
                console.log('🖼️ MapImage załadowany, aktualizuję transformację...');
                this.updateTransform();
                // Nie wywołujemy renderFog tutaj - zostanie wywołane przez fetchFogState
            });
        }
    }

    // Aktualizacja transformacji mapy - zgodnie z systemem GM
    updateTransform() {
        if (!this.mapImage || !this.mapContainer) {
            console.log('🔄 UpdateTransform: Brak mapImage lub mapContainer');
            return;
        }
        if (!this.mapImage.complete || this.mapImage.naturalWidth === 0) {
            console.log('🔄 UpdateTransform: Mapa nie załadowana lub ma zerowe rozmiary');
            return;
        }

        // Obliczenia takie same jak w GM
        const cw = this.mapContainer.clientWidth;
        const ch = this.mapContainer.clientHeight;
        const mw = this.mapImage.naturalWidth;
        const mh = this.mapImage.naturalHeight;

        if (!cw || !ch || !mw || !mh) {
            console.log('🔄 UpdateTransform: Nieprawidłowe rozmiary:', {cw, ch, mw, mh});
            return;
        }

        // Pozycjonowanie wrappera na środku kontenera (jak w GM)
        const wrapperLeft = (cw - mw) / 2;
        const wrapperTop = (ch - mh) / 2;
        const originX = cw / 2 - wrapperLeft;
        const originY = ch / 2 - wrapperTop;

        console.log('🔄 UpdateTransform obliczenia:');
        console.log(`   Container: ${cw}x${ch}`);
        console.log(`   Map: ${mw}x${mh}`);
        console.log(`   WrapperPos: left=${wrapperLeft}, top=${wrapperTop}`);
        console.log(`   Origin: x=${originX}, y=${originY}`);
        console.log(`   Transform values: pan=(${this.panX}, ${this.panY}), zoom=${this.zoom}, rotation=${this.rotation}°`);

        // Znajdź mapWrapper (to powinien być rodzic mapImage)
        const mapWrapper = document.getElementById('mapWrapper');
        if (!mapWrapper) {
            console.error('🔄 UpdateTransform: Nie znaleziono mapWrapper!');
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

        console.log(`🔄 Ustawianie transform: ${transform}`);
        mapWrapper.style.transform = transform;

        // Sprawdź czy transform się faktycznie zaaplikował
        const appliedTransform = mapWrapper.style.transform;
        console.log(`🔄 Transform zaaplikowany: ${appliedTransform}`);

        if (appliedTransform !== transform) {
            console.error(`❌ Transform nie został zaaplikowany prawidłowo! Oczekiwany: ${transform}, Faktyczny: ${appliedTransform}`);
        }

        // Ustaw rozmiary canvas-ów jeśli mapa jest załadowana
        if (this.fogCanvas && this.fogCanvas.width !== mw) {
            this.fogCanvas.width = mw;
            this.fogCanvas.height = mh;
            console.log('🔄 Ustawiono rozmiar fogCanvas');
        }

        if (this.charactersLayer && this.charactersLayer.width !== mw) {
            this.charactersLayer.width = mw;
            this.charactersLayer.height = mh;
            console.log('🔄 Ustawiono rozmiar charactersLayer');
        }
    }

    // Pobieranie nazwy mapy podglądu
    async fetchPreviewMapName() {
        try {
            const response = await fetch('/api/preview-map');
            if (response.ok) {
                this.previewMapName = await response.text();
                if (this.previewMapName) {
                    console.log('📋 Pobrano nazwę mapy podglądu:', this.previewMapName);
                }
            }
        } catch (err) {
            console.warn('⚠️ Nie udało się pobrać nazwy mapy podglądu:', err);
        }
    }

    // Polling nazwy mapy gdy nie jest ustawiona
    startPreviewMapPolling() {
        console.log('🔄 Uruchomiono polling nazwy mapy...');
        const pollInterval = setInterval(async () => {
            await this.fetchPreviewMapName();
            if (this.previewMapName) {
                clearInterval(pollInterval);
                console.log('✅ Mapa podglądu została ustawiona, inicjalizacja danych...');
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
                        console.log('🖼️ Mapa załadowana:', this.mapImage.naturalWidth, 'x', this.mapImage.naturalHeight);
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
                console.log(`🔲 Stan ramki viewport: ${this.viewportFrameEnabled ? 'WŁĄCZONA' : 'WYŁĄCZONA'}`);
            }
        } catch (error) {
            console.warn('⚠️ Nie można sprawdzić stanu ramki viewport:', error);
            this.viewportFrameEnabled = false;
        }
    }
    async fetchMapSettings() {
        if (!this.previewMapName) {
            console.log('⚙️ FetchMapSettings: Brak previewMapName');
            return;
        }

        try {
            const response = await fetch(`/api/settings/${this.previewMapName}`);
            console.log(`⚙️ FetchMapSettings response status: ${response.status}`);

            if (response.ok) {
                const settings = await response.json();
                console.log(`⚙️ RAW settings from backend:`, settings);

                // Ustaw początkowe ustawienia zgodnie z GM
                // Obsługa różnych struktur danych z backendu
                if (settings.panOffset) {
                    // Nowa struktura z panOffset obiektem
                    this.panX = settings.panOffset.x || 0;
                    this.panY = settings.panOffset.y || 0;
                    console.log(`⚙️ Używam panOffset: x=${this.panX}, y=${this.panY}`);
                } else {
                    // Stara struktura z bezpośrednimi właściwościami
                    this.panX = settings.panX || 0;
                    this.panY = settings.panY || 0;
                    console.log(`⚙️ Używam panX/panY: x=${this.panX}, y=${this.panY}`);
                }

                this.zoom = settings.zoom || 1;
                this.rotation = settings.rotation || 0;

                console.log(`⚙️ Pobrano ustawienia mapy:`);
                console.log(`   zoom=${this.zoom}`);
                console.log(`   pan=(${this.panX}, ${this.panY})`);
                console.log(`   rotation=${this.rotation}°`);

                // Zastosuj transformację po załadowaniu ustawień
                this.updateTransform();
            } else if (response.status === 404) {
                console.warn(`⚠️ Brak ustawień dla mapy ${this.previewMapName}, używam domyślnych`);
                // Zostaw domyślne wartości (0, 0, 1, 0)
                this.updateTransform();
            } else {
                console.warn(`⚠️ FetchMapSettings failed: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error fetching map settings:', error);
            console.log('⚙️ Używam domyślnych wartości po błędzie');
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
                // Loguj tylko przy zmianach
                const newCount = this.fogState?.revealedAreas?.length || 0;
                if (this.lastFogCount !== newCount) {
                    console.log(`🌫️ Mgła zaktualizowana: ${newCount} obszarów`);
                    this.lastFogCount = newCount;
                }
                this.renderFog();
            }
        } catch (error) {
            if (Math.random() < 0.1) { // Loguj błędy tylko czasami
                console.error('❌ Error fetching fog state:', error);
            }
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

                // Loguj tylko przy zmianach
                const newPlayersCount = this.characters?.players?.length || 0;
                const newEnemiesCount = this.characters?.enemies?.length || 0;
                if (this.lastPlayersCount !== newPlayersCount || this.lastEnemiesCount !== newEnemiesCount) {
                    console.log(`👥 Postacie zaktualizowane: ${newPlayersCount} graczy, ${newEnemiesCount} wrogów`);
                    this.lastPlayersCount = newPlayersCount;
                    this.lastEnemiesCount = newEnemiesCount;
                }

                this.drawCharacters();
            }
        } catch (error) {
            if (Math.random() < 0.1) { // Loguj błędy tylko czasami
                console.error('❌ Error fetching characters:', error);
            }
        }
    }

    // Polling komend nawigacji
    pollNavigationCommands() {
        let pollCount = 0;
        setInterval(() => {
            pollCount++;
            fetch('/api/preview-map/navigation')
                .then(response => response.json())
                .then(command => {
                    if (command && Object.keys(command).length > 0) {
                        console.log('📡 Otrzymano komendę nawigacji:', command);
                        this.handleNavigationCommand(command);
                    } else {
                        // Loguj puste odpowiedzi tylko czasami
                        if (pollCount % 100 === 1) {
                            console.log('⚪ Polling - brak komend do wykonania');
                        }
                    }
                })
                .catch(err => {
                    // Tylko loguj błędy połączenia co 10 sekund żeby nie spamować
                    if (Math.random() < 0.01) {
                        console.error('❌ Error polling navigation:', err);
                    }
                });
        }, 100);
    }

    // Obsługa poleceń nawigacji
    handleNavigationCommand(command) {
        console.log('🧭 Podgląd otrzymał komendę nawigacji:', command);

        if (!command || typeof command !== 'object') {
            console.log('⚠️ Nieprawidłowa komenda nawigacji:', command);
            return;
        }

        try {
            // Destrukturyzacja z wartościami domyślnymi - eliminuje ReferenceError
            const { action = '', direction = '', step = 5, value, rotation } = command;

            console.log(`🔍 SWITCH DEBUG: action="${action}", typeof action="${typeof action}"`);

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
                    console.log('🔍 Nowy zoom:', this.zoom);
                    this.updateTransform();
                    break;
                case 'rotate':
                    const rotationValue = typeof rotation === 'string' ? parseFloat(rotation) : rotation;
                    if (typeof rotationValue === 'number' && !isNaN(rotationValue)) {
                        console.log(`🔄 GM wysyła nowy obrót: ${rotationValue}° (obecny podglądu: ${this.rotation}°)`);
                        this.rotation = rotationValue;
                        console.log(`🔄 Podgląd ustawiony na obrót GM: ${this.rotation}°`);
                        this.updateTransform();
                        // Przerenuj postacie z nowym obrotem
                        this.drawCharacters();
                    } else {
                        console.warn('⚠️ Nieprawidłowa wartość rotation:', rotation);
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
                    console.log('🚨 CASE RELOAD-PAGE WYKONANY! 🚨');
                    console.log('🔄 RELOAD-PAGE: GM zażądał przeładowania podglądu');
                    console.log('📺 Przeładowuję stronę podglądu...');

                    // Dodatkowe sprawdzenie czy to rzeczywiście dociera
                    console.warn('⚡ PRZED PRÓBĄ PRZEŁADOWANIA - to powinno być ostatni log przed reload!');

                    // AGRESYWNE PRZEŁADOWANIE - kilka metod jednocześnie
                    try {
                        // Zatrzymaj wszystkie interwały żeby nie przeszkadzały
                        if (this.navigationPollingInterval) {
                            clearInterval(this.navigationPollingInterval);
                            console.log('⏹️ Zatrzymano navigation polling');
                        }

                        // Metoda 1: Natychmiastowe przeładowanie
                        console.log('🔄 WYKONUJĘ: window.location.reload(true)');
                        window.location.reload(true);

                        // Metoda 2: Backup po 50ms
                        setTimeout(() => {
                            console.log('🔄 BACKUP: window.location.href = current + timestamp');
                            window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
                        }, 50);

                        // Metoda 3: Agresywny backup po 100ms
                        setTimeout(() => {
                            console.log('🔄 AGGRESSIVE: document.location.replace()');
                            document.location.replace(window.location.href.split('?')[0] + '?refresh=' + Date.now());
                        }, 100);

                        // Metoda 4: Ostateczny fallback po 200ms
                        setTimeout(() => {
                            console.log('🔄 ULTIMATE: history.go(0)');
                            window.history.go(0);
                        }, 200);

                        // Metoda 5: Nuclear option po 300ms
                        setTimeout(() => {
                            console.log('🔄 NUCLEAR: force window.open and close');
                            const newWindow = window.open(window.location.href.split('?')[0], '_self');
                            if (newWindow) {
                                newWindow.location.reload(true);
                            }
                        }, 300);

                    } catch (reloadError) {
                        console.error('❌ Błąd podczas przeładowania:', reloadError);
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

        console.log('📍 VIEWPORT DEBUG (FIXED FOR CONTAINER DIFFERENCES):');
        console.log(`   Podgląd Container: ${cw}x${ch}, Image: ${imageWidth}x${imageHeight}`);
        console.log(`   Transform: pan=(${this.panX}, ${this.panY}), zoom=${this.zoom}, rotation=${this.rotation}°`);

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

        console.log('📍 NAPRAWIONE obliczenia (uwzględniając różne kontenery):');
        console.log(`   x = max(0, -panX/zoom) = max(0, ${-this.panX}/${this.zoom}) = ${x.toFixed(1)}`);
        console.log(`   y = max(0, -panY/zoom) = max(0, ${-this.panY}/${this.zoom}) = ${y.toFixed(1)}`);
        console.log(`   effectiveViewport: ${effectiveViewportWidth.toFixed(1)}x${effectiveViewportHeight.toFixed(1)} (rotation=${this.rotation}°)`);
        console.log(`   w = min(effectiveW, imageWidth-x) = min(${effectiveViewportWidth.toFixed(1)}, ${imageWidth}-${x.toFixed(1)}) = ${w.toFixed(1)}`);
        console.log(`   h = min(effectiveH, imageHeight-y) = min(${effectiveViewportHeight.toFixed(1)}, ${imageHeight}-${y.toFixed(1)}) = ${h.toFixed(1)}`);

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

        console.log('📤 PODGLĄD wysyła viewport (FIXED FOR DIFFERENT CONTAINERS):', {
            x: viewport.x, y: viewport.y,
            width: viewport.width, height: viewport.height
        });

        fetch('/api/preview-map/viewport', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(viewport)
        }).catch(err => {
            console.error('❌ Error sending viewport data:', err);
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
                        console.log(`🔲 Stan ramki viewport zmieniony: ${this.viewportFrameEnabled ? 'WŁĄCZONA (ukryta)' : 'WYŁĄCZONA'}`);

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

    // Debug - manualne odświeżenie danych
    async manualRefresh() {
        console.log('🔄 Manualne odświeżenie danych...');
        if (this.previewMapName) {
            await this.fetchFogState();
            await this.fetchCharacters();
        } else {
            console.warn('⚠️ Brak nazwy mapy do odświeżenia');
        }
    }

    // Debug - testowe funkcje
    testRender() {
        console.log('🧪 TEST: Renderowanie mgły i postaci...');
        console.log('🧪 TEST: Elementy DOM:', {
            mapImage: {
                exists: !!this.mapImage,
                complete: this.mapImage?.complete,
                width: this.mapImage?.naturalWidth,
                height: this.mapImage?.naturalHeight
            },
            fogCanvas: {
                exists: !!this.fogCanvas,
                width: this.fogCanvas?.width,
                height: this.fogCanvas?.height
            },
            charactersLayer: {
                exists: !!this.charactersLayer,
                width: this.charactersLayer?.width,
                height: this.charactersLayer?.height
            }
        });

        if (this.fogState) {
            console.log('🧪 TEST: FogState:', this.fogState);
            this.renderFog();
        } else {
            console.warn('🧪 TEST: Brak fogState');
        }

        if (this.characters) {
            console.log('🧪 TEST: Characters:', this.characters);
            this.drawCharacters();
        } else {
            console.warn('🧪 TEST: Brak characters');
        }
    }

    // Debug - test obrotu
    testRotation(degrees) {
        console.log('🧪 TEST ROTATION: Ustawiam obrót na', degrees + '°');
        this.rotation = degrees || 90;
        this.updateTransform();
        this.drawCharacters();
        console.log('🧪 TEST ROTATION: Obrót ustawiony, current rotation:', this.rotation + '°');
    }

    // Debug - test viewport
    debugViewport() {
        console.log('🧪 DEBUG VIEWPORT:');
        console.log('  Pan:', { x: this.panX, y: this.panY });
        console.log('  Zoom:', this.zoom);
        console.log('  Rotation:', this.rotation + '°');
        console.log('  MapSize:', {
            w: this.mapImage?.naturalWidth,
            h: this.mapImage?.naturalHeight
        });
        console.log('  ContainerSize:', {
            w: this.mapContainer?.clientWidth,
            h: this.mapContainer?.clientHeight
        });
        this.reportViewport();
        console.log('  Viewport wysłany do serwera ↑');
    }

    // Debug - test viewport bez obrotu
    testViewportSimple() {
        console.log('🧪 TEST VIEWPORT SIMPLE: Reset do stanu bazowego');
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1;
        this.rotation = 0;

        this.updateTransform();

        setTimeout(() => {
            console.log('📤 Wysyłanie viewport w stanie bazowym...');
            this.reportViewport();
        }, 200);

        console.log('🧪 TEST: Sprawdź czy w GM pojawia się ramka w całej mapie');
    }

    // Debug - test viewport z obecnymi ustawieniami i pełnym debugiem
    testViewportDetailed() {
        console.log('🧪 TEST VIEWPORT DETAILED: Test z obecnymi ustawieniami');
        console.log(`   Obecne: pan=(${this.panX}, ${this.panY}), zoom=${this.zoom}, rotation=${this.rotation}°`);

        // Wymuś wywołanie reportViewport z debugiem
        this.reportViewport();

        console.log('🧪 TEST: Sprawdź logi viewport powyżej');
    }

    // Debug - test viewport bez obrotu do diagnozy problemu
    testViewportNoRotation() {
        console.log('🧪 TEST VIEWPORT NO ROTATION: Diagnoza problemu');

        // Resetuj do stanu bez obrotu
        const originalRotation = this.rotation;
        this.rotation = 0;
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1;

        console.log('📍 Stan testowy: rotation=0°, pan=(0,0), zoom=1');
        console.log(`   Container podglądu: ${this.mapContainer.clientWidth}x${this.mapContainer.clientHeight}`);

        // Aktualizuj transform i wyślij viewport
        this.updateTransform();
        setTimeout(() => {
            this.reportViewport();
            console.log('🧪 Sprawdź w GM czy ramka pokrywa całą mapę');
            console.log('   Jeśli nie -> problem z różnymi rozmiarami kontenerów');
            console.log('   Jeśli tak -> problem z obliczeniami obrotu');

            // Przywróć oryginalny obrót
            this.rotation = originalRotation;
            this.updateTransform();
        }, 200);
    }

    // Debug - test naprawionej nawigacji
    testNavigationFixed() {
        console.log('🧪 TEST NAVIGATION FIXED: Testowanie naprawionej nawigacji');
        console.log(`   Obecna pozycja: pan=(${this.panX}, ${this.panY})`);

        console.log('🧪 Test: przesuwanie w lewo (powinno przesunąć mapę w lewo)');
        this.handleNavigationCommand({ action: 'pan', direction: 'left' });

        setTimeout(() => {
            console.log(`   Po ruchu w lewo: pan=(${this.panX}, ${this.panY})`);
            console.log('🧪 Sprawdź: czy mapa przesunęła się w lewo?');

            // Przywróć pozycję
            this.panX += 100;
            this.updateTransform();
        }, 500);
    }

    // Debug - test viewport bez wpływu zoom
    testViewportNoZoom() {
        console.log('🧪 TEST VIEWPORT NO ZOOM: Test ramki bez wpływu zoom podglądu');
        console.log(`   Obecny zoom podglądu: ${this.zoom}`);

        // Test z różnymi zoom
        const originalZoom = this.zoom;

        console.log('🧪 Test zoom=1.0:');
        this.zoom = 1.0;
        this.reportViewport();

        setTimeout(() => {
            console.log('🧪 Test zoom=2.0:');
            this.zoom = 2.0;
            this.reportViewport();

            setTimeout(() => {
                console.log('🧪 Przywracam oryginalny zoom:', originalZoom);
                this.zoom = originalZoom;
                this.updateTransform();
                this.reportViewport();

                console.log('🧪 Sprawdź w GM: czy ramka ma taką samą wielkość przy wszystkich zoom?');
            }, 1000);
        }, 1000);
    }

    // Debug - test kompletnej naprawki nawigacji i viewport
    testCompleteNavigation() {
        console.log('🧪 TEST COMPLETE: Pełny test naprawionej nawigacji i viewport');
        console.log(`   Stan początkowy: pan=(${this.panX}, ${this.panY}), ramka=${this.viewportFrameEnabled}`);

        if (!this.viewportFrameEnabled) {
            console.log('⚠️ UWAGA: Ramka viewport jest WYŁĄCZONA');
            console.log('   W GM musisz kliknąć "wczytaj podgląd" żeby włączyć ramkę');
            return;
        }

        // Test sekwencji ruchów
        console.log('🧪 Test 1: Ruch w prawo (GM prawo = podgląd lewo)');
        this.handleNavigationCommand({ action: 'pan', direction: 'right' });

        setTimeout(() => {
            console.log(`   Po ruchu w prawo: pan=(${this.panX}, ${this.panY})`);
            console.log('🧪 Test 2: Ruch w dół');
            this.handleNavigationCommand({ action: 'pan', direction: 'down' });

            setTimeout(() => {
                console.log(`   Po ruchu w dół: pan=(${this.panX}, ${this.panY})`);
                console.log('🧪 Sprawdź w GM: czy ramka przesunęła się prawidłowo?');
                console.log('   - Ramka powinna być w odpowiednim miejscu');
                console.log('   - Rozmiar ramki nie powinien zmieniać się przy zoom');
            }, 1000);
        }, 1000);
    }

    // Debug - szybki test kierunku LEFT z nową logiką
    testDirectionLeft() {
        console.log('🧪 QUICK TEST: Kierunek LEFT (viewport logic)');
        console.log(`   Przed: pan=(${this.panX}, ${this.panY})`);

        this.handleNavigationCommand({ action: 'pan', direction: 'left' });

        console.log(`   Po LEFT: pan=(${this.panX}, ${this.panY})`);
        console.log('🧪 SPRAWDŹ (viewport logic):');
        console.log('   - panX powinien ZWIĘKSZYĆ się (viewport w lewo = panX++)');
        console.log('   - W GM: ramka powinna przesunąć się w LEWO');
        console.log('   - W podglądzie: mapa powinna przesunąć się w LEWO (viewport w lewo)');
        console.log('   - Jeśli mapa podglądu idzie w prawo = nadal źle!');
    }

    // Debug - prosty test jednego kierunku z GM compatible viewport
    quickTestDirection(dir) {
        const startX = this.panX;
        const startY = this.panY;
        console.log(`🧪 QUICK TEST: Kierunek ${dir.toUpperCase()} (GM compatible)`);
        console.log(`   Przed: pan=(${this.panX}, ${this.panY})`);

        this.handleNavigationCommand({ action: 'pan', direction: dir });

        const deltaX = this.panX - startX;
        const deltaY = this.panY - startY;

        console.log(`   Po ${dir.toUpperCase()}: pan=(${this.panX}, ${this.panY})`);
        console.log(`   Zmiana: ΔX=${deltaX}, ΔY=${deltaY}`);

        // Oblicz viewport jak GM
        const x = Math.max(0, -this.panX / this.zoom);
        const y = Math.max(0, -this.panY / this.zoom);
        console.log(`   Viewport: x=${x.toFixed(1)}, y=${y.toFixed(1)} (GM formula: -pan/zoom)`);

        if (dir === 'left' && deltaX > 0) {
            console.log('✅ LEFT: panX zwiększył się - viewport logic OK');
        } else if (dir === 'right' && deltaX < 0) {
            console.log('✅ RIGHT: panX zmniejszył się - viewport logic OK');
        } else if (dir === 'up' && deltaY > 0) {
            console.log('✅ UP: panY zwiększył się - viewport logic OK');
        } else if (dir === 'down' && deltaY < 0) {
            console.log('✅ DOWN: panY zmniejszył się - viewport logic OK');
        } else {
            console.log('❌ BŁĄD: kierunek nie działa zgodnie z viewport logic!');
        }

        console.log('🧪 Sprawdź: czy ramka w GM jest teraz w odpowiednim miejscu?');
        console.log('🧪 Sprawdź: czy podgląd pokazuje ten sam obszar co ramka GM?');
    }

    // Debug - test synchronizacji viewport z GM z różnymi kontenerami
    testViewportSync() {
        console.log('🧪 TEST VIEWPORT SYNC: Synchronizacja viewport z GM (różne kontenery)');
        console.log(`   Podgląd container: ${this.mapContainer.clientWidth}x${this.mapContainer.clientHeight}`);
        console.log(`   Obecny stan: pan=(${this.panX}, ${this.panY}), zoom=${this.zoom}, rotation=${this.rotation}°`);

        if (!this.viewportFrameEnabled) {
            console.log('⚠️ RAMKA WYŁĄCZONA! Włącz przez "wczytaj podgląd" w GM');
            return;
        }

        // Oblicz viewport uwzględniając różne rozmiary kontenerów
        const cw = this.mapContainer.clientWidth;
        const ch = this.mapContainer.clientHeight;
        const imageWidth = this.mapImage.naturalWidth;
        const imageHeight = this.mapImage.naturalHeight;

        const x = Math.max(0, -this.panX / this.zoom);
        const y = Math.max(0, -this.panY / this.zoom);

        // Uwzględnij obrót dla rozmiarów viewport
        let effectiveViewportWidth, effectiveViewportHeight;
        if (this.rotation === 90 || this.rotation === 270) {
            effectiveViewportWidth = ch / this.zoom;
            effectiveViewportHeight = cw / this.zoom;
        } else {
            effectiveViewportWidth = cw / this.zoom;
            effectiveViewportHeight = ch / this.zoom;
        }

        const w = Math.min(effectiveViewportWidth, imageWidth - x);
        const h = Math.min(effectiveViewportHeight, imageHeight - y);

        console.log('📊 Viewport obliczenia (FIXED dla różnych kontenerów):');
        console.log(`   Image: ${imageWidth}x${imageHeight}`);
        console.log(`   Container podglądu: ${cw}x${ch}`);
        console.log(`   Effective viewport (rotation=${this.rotation}°): ${effectiveViewportWidth.toFixed(1)}x${effectiveViewportHeight.toFixed(1)}`);
        console.log(`   x = max(0, -pan/zoom) = max(0, -${this.panX}/${this.zoom}) = ${x.toFixed(1)}`);
        console.log(`   y = max(0, -pan/zoom) = max(0, -${this.panY}/${this.zoom}) = ${y.toFixed(1)}`);
        console.log(`   w = min(effectiveW, imageW-x) = min(${effectiveViewportWidth.toFixed(1)}, ${imageWidth}-${x.toFixed(1)}) = ${w.toFixed(1)}`);
        console.log(`   h = min(effectiveH, imageH-y) = min(${effectiveViewportHeight.toFixed(1)}, ${imageHeight}-${y.toFixed(1)}) = ${h.toFixed(1)}`);
        console.log(`   → Viewport: (${x.toFixed(1)}, ${y.toFixed(1)}) ${w.toFixed(1)}x${h.toFixed(1)}`);

        // Wyślij viewport
        this.reportViewport();

        console.log('🧪 SPRAWDŹ w GM:');
        console.log('   1. Czy ramka w GM pokrywa odpowiedni obszar mapy?');
        console.log('   2. Czy rozmiar ramki jest prawidłowy (nie za mały/duży)?');
        console.log('   3. Czy podgląd pokazuje ten sam obszar co ramka?');
        console.log('   4. Jeśli ramka ma błędny rozmiar = problem z różnymi kontenerami');
    }

    // Debug - test synchronizacji obrotu z GM
    testRotationSync() {
        console.log('🧪 TEST ROTATION SYNC: Synchronizacja obrotu z GM');
        console.log(`   Obecny obrót podglądu: ${this.rotation}°`);

        if (!this.viewportFrameEnabled) {
            console.log('⚠️ RAMKA WYŁĄCZONA! Włącz przez "wczytaj podgląd" w GM');
            return;
        }

        // Symuluj różne obroty
        const testRotations = [0, 90, 180, 270];

        testRotations.forEach((rot, index) => {
            setTimeout(() => {
                console.log(`🔄 TEST ${index + 1}/4: Ustawianie obrót na ${rot}°`);
                this.rotation = rot;
                this.updateTransform();
                this.reportViewport();

                console.log(`   Viewport z obrotem ${rot}°:`);
                const x = Math.max(0, -this.panX / this.zoom);
                const y = Math.max(0, -this.panY / this.zoom);
                console.log(`   → x=${x.toFixed(1)}, y=${y.toFixed(1)}, rotation=${this.rotation}°`);
            }, index * 1500);
        });

        setTimeout(() => {
            console.log('🧪 SPRAWDŹ w GM:');
            console.log('   1. Czy ramka przesuwała się przy zmianie obrotu?');
            console.log('   2. Czy podgląd pokazuje ten sam obszar co ramka przy każdym obrocie?');
            console.log('   3. Jeśli nie - problem z obsługą obrotu w viewport');
        }, testRotations.length * 1500 + 500);
    }

    // Debug - test viewport z różnymi rotacjami i różnymi kontenerami
    testViewportWithRotations() {
        console.log('🧪 TEST VIEWPORT WITH ROTATIONS: Test viewport z różnymi obrotami');
        console.log(`   Container różnice: Podgląd ${this.mapContainer.clientWidth}x${this.mapContainer.clientHeight}`);
        console.log(`   (GM prawdopodobnie: ~1595x1271 - różne rozmiary!)`);

        if (!this.viewportFrameEnabled) {
            console.log('⚠️ RAMKA WYŁĄCZONA! Włącz przez "wczytaj podgląd" w GM');
            return;
        }

        const testRotations = [0, 90, 180, 270];
        const originalRotation = this.rotation;

        testRotations.forEach((rot, index) => {
            setTimeout(() => {
                console.log(`🔄 TEST ${index + 1}/4: Viewport z obrotem ${rot}°`);
                this.rotation = rot;
                this.updateTransform();

                // Oblicz viewport dla tego obrotu
                const cw = this.mapContainer.clientWidth;
                const ch = this.mapContainer.clientHeight;

                let effectiveW, effectiveH;
                if (rot === 90 || rot === 270) {
                    effectiveW = ch / this.zoom;
                    effectiveH = cw / this.zoom;
                } else {
                    effectiveW = cw / this.zoom;
                    effectiveH = ch / this.zoom;
                }

                console.log(`   Rotation ${rot}°: effective viewport ${effectiveW.toFixed(1)}x${effectiveH.toFixed(1)}`);
                this.reportViewport();
            }, index * 1000);
        });

        setTimeout(() => {
            // Przywróć oryginalny obrót
            this.rotation = originalRotation;
            this.updateTransform();
            console.log(`🔄 Przywrócono oryginalny obrót: ${originalRotation}°`);

            console.log('🧪 SPRAWDŹ w GM:');
            console.log('   1. Czy ramka miała prawidłowy rozmiar przy każdym obrocie?');
            console.log('   2. Czy uwzględniono różnice rozmiarów kontenerów?');
            console.log('   3. Czy viewport 90°/270° ma zamienione wymiary?');
        }, testRotations.length * 1000 + 500);
    }

    // Debug - test kierunków z diagnozą podstawowego mapowania
    testDirectionsWithRotation() {
        console.log('🧪 TEST DIRECTIONS (BASIC MAPPING): Podstawowe mapowanie kierunków');
        console.log(`   Aktualny obrót mapy: ${this.rotation}°`);
        console.log(`   Pozycja START: pan=(${this.panX}, ${this.panY})`);

        if (!this.viewportFrameEnabled) {
            console.log('⚠️ RAMKA WYŁĄCZONA! Włącz przez "wczytaj podgląd" w GM');
            return;
        }

        // Test kierunku RIGHT który powoduje problemy (ramka do góry)
        console.log('🧪 TEST: RIGHT (który powoduje "ramka do góry")');
        const startX = this.panX;
        const startY = this.panY;

        this.handleNavigationCommand({ action: 'pan', direction: 'right' });

        const deltaX = this.panX - startX;
        const deltaY = this.panY - startY;

        console.log(`   Po RIGHT: ΔX=${deltaX}, ΔY=${deltaY}`);
        console.log(`   Nowa pozycja: pan=(${this.panX}, ${this.panY})`);

        // Analiza - co się faktycznie stało
        if (deltaX > 0 && deltaY === 0) {
            console.log('📊 ANALIZA: RIGHT → ΔX+ (pan w prawo)');
            console.log('   🧪 SPRAWDŹ w GM: czy ramka przesunęła się w PRAWO?');
            console.log('   ❓ Jeśli ramka idzie do GÓRY = kierunki są odwrócone!');
        } else if (deltaX === 0 && deltaY < 0) {
            console.log('📊 ANALIZA: RIGHT → ΔY- (pan do góry)');
            console.log('   ❌ PROBLEM: RIGHT robi pan do góry zamiast w prawo!');
        } else if (deltaX === 0 && deltaY > 0) {
            console.log('📊 ANALIZA: RIGHT → ΔY+ (pan w dół)');
            console.log('   ❌ PROBLEM: RIGHT robi pan w dół zamiast w prawo!');
        } else {
            console.log('📊 ANALIZA: RIGHT → nieoczekiwane ΔX/ΔY');
            console.log('   ❌ PROBLEM: Kierunek RIGHT działa nieprawidłowo');
        }

        console.log('🧪 KOLEJNY TEST za 2 sekundy...');

        // Test DOWN po 2 sekundach
        setTimeout(() => {
            console.log('🧪 TEST: DOWN');
            const startX2 = this.panX;
            const startY2 = this.panY;

            this.handleNavigationCommand({ action: 'pan', direction: 'down' });

            const deltaX2 = this.panX - startX2;
            const deltaY2 = this.panY - startY2;

            console.log(`   Po DOWN: ΔX=${deltaX2}, ΔY=${deltaY2}`);

            if (deltaX2 === 0 && deltaY2 > 0) {
                console.log('📊 ANALIZA: DOWN → ΔY+ (pan w dół) - PRAWIDŁOWE');
            } else if (deltaX2 > 0 && deltaY2 === 0) {
                console.log('📊 ANALIZA: DOWN → ΔX+ (pan w prawo) - BŁĘDNE!');
            } else {
                console.log('📊 ANALIZA: DOWN → nieoczekiwane ΔX/ΔY');
            }
        }, 2000);
    }

    // Debug - test jak viewport współrzędne wpływają na ramkę w GM
    testViewportCoordinates() {
        console.log('🧪 TEST VIEWPORT COORDINATES: Jak viewport wpływa na ramkę');
        console.log(`   Obecny viewport będzie wysyłany z logowania reportViewport()`);

        if (!this.viewportFrameEnabled) {
            console.log('⚠️ RAMKA WYŁĄCZONA! Włącz przez "wczytaj podgląd" w GM');
            return;
        }

        // Sprawdź obecny viewport
        const x = Math.max(0, -this.panX / this.zoom);
        const y = Math.max(0, -this.panY / this.zoom);

        console.log('📊 OBECNY VIEWPORT:');
        console.log(`   pan: (${this.panX}, ${this.panY})`);
        console.log(`   viewport.x: ${x} (= max(0, -panX/zoom))`);
        console.log(`   viewport.y: ${y} (= max(0, -panY/zoom))`);
        console.log('');
        console.log('🧪 TEORIA:');
        console.log('   - viewport.x to pozycja X ramki w GM');
        console.log('   - viewport.y to pozycja Y ramki w GM');
        console.log('   - Jeśli panX++, to viewport.x-- (odwrotnie)');
        console.log('   - Jeśli panY++, to viewport.y-- (odwrotnie)');
        console.log('');
        console.log('🔬 EKSPERYMENT:');
        console.log('   Za chwilę zwiększę panX o 100 i wyślę nowy viewport');
        console.log('   viewport.x powinien zmaleć o 100');
        console.log('   W GM ramka powinna przesunąć się w LEWO');

        const oldX = x;
        const oldPanX = this.panX;

        // Zwiększ panX
        this.panX += 100;
        this.updateTransform();

        setTimeout(() => {
            const newX = Math.max(0, -this.panX / this.zoom);
            console.log('📊 WYNIKI EKSPERYMENTU:');
            console.log(`   panX: ${oldPanX} → ${this.panX} (Δ=+100)`);
            console.log(`   viewport.x: ${oldX} → ${newX} (Δ=${newX - oldX})`);
            console.log('   🧪 SPRAWDŹ w GM: czy ramka przesunęła się w LEWO?');
            console.log('   ❓ Jeśli ramka przesunęła się w PRAWO lub w GÓRĘ/DÓŁ = problem z osiami!');

            this.reportViewport();
        }, 100);
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

    // Debug - test naprawionych kierunków nawigacji
    testNavigationDirections() {
        console.log('🧪 TEST NAVIGATION DIRECTIONS: Test naprawionych kierunków');
        console.log(`   Obrót mapy: ${this.rotation}°`);
        console.log(`   Pozycja START: pan=(${this.panX}, ${this.panY})`);
        console.log('   OCZEKIWANE ZACHOWANIE:');
        console.log('   - RIGHT: mapa w PRAWO ✅');
        console.log('   - LEFT: mapa w LEWO ✅');
        console.log('   - UP: mapa w GÓRĘ (naprawione)');
        console.log('   - DOWN: mapa w DÓŁ (naprawione)');

        const directions = ['right', 'left', 'up', 'down'];
        let index = 0;

        const testNext = () => {
            if (index >= directions.length) {
                console.log('\n✅ Test wszystkich kierunków zakończony!');
                console.log('🧪 SPRAWDŹ WIZUALNIE czy wszystkie kierunki działają poprawnie');
                return;
            }

            const dir = directions[index];
            console.log(`\n🧪 TEST ${index + 1}/4: ${dir.toUpperCase()}`);

            const startX = this.panX;
            const startY = this.panY;
            this.handleNavigationCommand({ action: 'pan', direction: dir });
            const deltaX = this.panX - startX;
            const deltaY = this.panY - startY;

            console.log(`   Pan: (${startX}, ${startY}) → (${this.panX}, ${this.panY})`);
            console.log(`   Delta: ΔX=${deltaX}, ΔY=${deltaY}`);

            index++;
            setTimeout(testNext, 1500);
        };

        testNext();
    }

    // Prosta funkcja testowa pojedynczego kierunku
    testDirection(direction) {
        console.log(`🧪 TEST ${direction.toUpperCase()}:`);
        const startX = this.panX;
        const startY = this.panY;

        this.handleNavigationCommand({ action: 'pan', direction: direction });

        const deltaX = this.panX - startX;
        const deltaY = this.panY - startY;
        console.log(`   Pan: (${startX}, ${startY}) → (${this.panX}, ${this.panY})`);
        console.log(`   Delta: ΔX=${deltaX}, ΔY=${deltaY}`);
    }
}

// INICJALIZACJA - uruchom PodgladManager po załadowaniu strony
let podgladManager;

window.addEventListener('load', async () => {
    console.log('🚀 PODGLĄD: Inicjalizacja PodgladManager...');

    try {
        podgladManager = new PodgladManager();
        await podgladManager.init();

        // Export globalny dla debugowania
        window.podgladManager = podgladManager;
        console.log('✅ PODGLĄD: PodgladManager zainicjalizowany pomyślnie!');
        console.log('🌍 PodgladManager dostępny globalnie jako window.podgladManager');
    } catch (error) {
        console.error('❌ PODGLĄD: Błąd inicjalizacji PodgladManager:', error);
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
