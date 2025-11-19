// app-modular.js - Główny plik łączący wszystkie moduły

console.log('🔥🔥🔥 APP-MODULAR.JS ZAŁADOWANY - NOWA WERSJA Z POPRAWKAMI FOG! 🔥🔥🔥');
console.log('📅 Wersja z:', new Date().toISOString());

class DnDMapViewer {
    constructor(){
        console.log('🎯 DnDMapViewer constructor wywołany - NOWA WERSJA!');

        // Podstawowe właściwości
        this.currentMap = null;
        this.fogState = null;
        this.zoom = 1;
        this.isPanning = false;
        this.panStart = {x:0, y:0};
        this.panOffset = {x:0, y:0};
        this.isAltPressed = false;
        this.gridSize = null;
        this.gridOffsetX = 0;
        this.gridOffsetY = 0;
        this.gridVisible = false;
        this.isCalibrating = false;
        this.calibrationStart = null;
        this.calibrationCurrent = null;
        this.highlightCenterCell = null;
        this.lastRevealedCell = null;
        this.lastPaintedCell = null;
        this.isDrawing = false;
        this.pendingFogPoints = [];
        this.saveTimeout = null;
        this.isPaintingFog = false;
        this.isErasingFog = false;
        this.fogMode = 'none';
        this.fogPollingInterval = null;
        this.lastFogStateHash = null;

        // Śledzenie już odkrytych komórek
        this.revealedCells = new Set();
        this.paintedCells = new Set();

        // Zmienne dla kolorów
        this.fogColor = '#808080';
        this.fogOpacity = 0.65;
        this.gridColor = '#ffffff';
        this.gridOpacity = 0.35;
        this.gridLineWidth = 1.0;

        // Viewport podglądu
        this.previewViewport = null;
        this.previewViewportCanvas = null;
        this.previewViewportCtx = null;
        this.viewportPollingInterval = null;
        this.previewViewportColor = '#ff0000';
        this.previewViewportVisible = false; // ZMIANA: startowo ukryta ramka podglądu
        this.isDrawingPreview = false; // Flaga zapobiegająca wielokrotnym wywołaniom

        // Obrót mapy
        this.rotation = 0;
        this.previewRotation = 0; // Dodatkowy obrót stosowany tylko w podglądzie
        this.remotePreviewControl = false; // Flaga: przyciski sterują tylko podglądem

        // Postacie
        this.charactersCanvas = null;
        this.charactersCtx = null;
        this.characters = { players: [], enemies: [] };
        this.characterMode = null;
        this.playerColor = '#00ff00';
        this.enemyColor = '#ff0000';
        this.draggingCharacter = null;
        this.enemyLetterCounter = 0;
        this.isShiftPressed = false;

        // Automatyczny zapis
        this.autoSaveInterval = null;

        // Rozmiar obszaru siatki
        this.gridAreaSizeValue = 3;


        // Inicjalizuj menedżery modułów
        console.log('🔍 Sprawdzanie dostępności klas menedżerów...');
        console.log('UIManager:', typeof UIManager);
        console.log('InputManager:', typeof InputManager);
        console.log('GridManager:', typeof GridManager);
        console.log('FogManager:', typeof FogManager);
        console.log('CharactersManager:', typeof CharactersManager);
        console.log('ViewportManager:', typeof ViewportManager);

        this.ui = new UIManager(this);
        this.input = new InputManager(this);
        this.grid = new GridManager(this);
        this.fog = new FogManager(this);
        this.charactersManager = new CharactersManager(this);
        this.viewport = new ViewportManager(this);

        // Wyczyść stare dane mgły z localStorage
        this.clearOldFogDataFromLocalStorage();

        // Inicjalizacja
        this.initElements();
        this.initEvents();
        this.startViewportPolling();
        this.startAutoSave();

        console.log('✅ DnDMapViewer konstruktor zakończony pomyślnie!');
    }

    // Metody delegowane do menedżerów
    initElements() {
        const elements = this.ui.initElements();

        // Deleguj wszystkie elementy DOM do głównej klasy
        this.mapSelect = this.ui.mapSelect;
        this.addMapBtn = this.ui.addMapBtn;
        this.deleteMapBtn = this.ui.deleteMapBtn;
        this.mapImage = this.ui.mapImage;
        this.mapWrapper = this.ui.mapWrapper;
        this.mapContainer = this.ui.mapContainer;
        this.fogCanvas = this.ui.fogCanvas;
        this.fogCtx = this.ui.fogCtx;
        this.gridCanvas = this.ui.gridCanvas;
        this.gridCtx = this.ui.gridCtx;
        this.calibrationCanvas = this.ui.calibrationCanvas;
        this.calibrationCtx = this.ui.calibrationCtx;
        this.viewportOverlayCanvas = this.ui.viewportOverlayCanvas;
        this.viewportOverlayCtx = this.ui.viewportOverlayCtx;
        this.gridAreaSize = this.ui.gridAreaSize;
        this.resetFogBtn = this.ui.resetFogBtn;
        this.toggleGridBtn = this.ui.toggleGridBtn;
        this.gridStatus = this.ui.gridStatus;
        this.rotatePreviewBtn = this.ui.rotatePreviewBtn;
        this.rotatePreviewLeftBtn = this.ui.rotatePreviewLeftBtn;
        this.zoomLevel = this.ui.zoomLevel;
        this.navUpBtn = this.ui.navUpBtn;
        this.navDownBtn = this.ui.navDownBtn;
        this.navLeftBtn = this.ui.navLeftBtn;
        this.navRightBtn = this.ui.navRightBtn;
        this.navCenterBtn = this.ui.navCenterBtn;

        // Nowe precyzyjne kontrolki zoom
        this.zoomInput = this.ui.zoomInput;
        this.zoomDecrease1Btn = this.ui.zoomDecrease1Btn;
        this.zoomIncrease1Btn = this.ui.zoomIncrease1Btn;
        this.zoom50Btn = this.ui.zoom50Btn;
        this.zoom100Btn = this.ui.zoom100Btn;
        this.zoom150Btn = this.ui.zoom150Btn;
        this.zoom200Btn = this.ui.zoom200Btn;

        this.gridCountXInput = this.ui.gridCountXInput;
        this.gridCountYInput = this.ui.gridCountYInput;
        this.gridSizeInput = this.ui.gridSizeInput;
        this.gridOffsetXInput = this.ui.gridOffsetXInput;
        this.gridOffsetYInput = this.ui.gridOffsetYInput;
        this.gridLineWidthInput = this.ui.gridLineWidthInput;
        this.saveGridBtn = this.ui.saveGridBtn;
        this.clearGridBtn = this.ui.clearGridBtn;
        this.paintFogBtn = this.ui.paintFogBtn;
        this.eraseFogBtn = this.ui.eraseFogBtn;
        this.gridColorPicker = this.ui.gridColorPicker;
        this.fogColorPickerView = this.ui.fogColorPickerView;
        this.fogOpacitySlider = this.ui.fogOpacitySlider;
        this.fogOpacityValue = this.ui.fogOpacityValue;
        this.viewportOverlayCanvas = this.ui.viewportOverlayCanvas;
        this.viewportOverlayCtx = this.ui.viewportOverlayCtx;
        this.rotateLeftBtn = this.ui.rotateLeftBtn;
        this.rotateRightBtn = this.ui.rotateRightBtn;
        this.resetRotationBtn = this.ui.resetRotationBtn;
        this.rotationValue = this.ui.rotationValue;
        this.charactersCanvas = this.ui.charactersCanvas;
        this.charactersCtx = this.ui.charactersCtx;
        this.addPlayerBtn = this.ui.addPlayerBtn;
        this.addEnemyBtn = this.ui.addEnemyBtn;
        this.moveCharacterBtn = this.ui.moveCharacterBtn;
        this.removeCharacterBtn = this.ui.removeCharacterBtn;
        this.removeLastPlayerBtn = this.ui.removeLastPlayerBtn;
        this.removeAllPlayersBtn = this.ui.removeAllPlayersBtn;
        this.removeLastEnemyBtn = this.ui.removeLastEnemyBtn;
        this.removeAllEnemiesBtn = this.ui.removeAllEnemiesBtn;
        this.playerColorPicker = this.ui.playerColorPicker;
        this.enemyColorPicker = this.ui.enemyColorPicker;
        this.sidebar = this.ui.sidebar;
        this.sidebarToggle = this.ui.sidebarToggle;
        this.sectionToggles = this.ui.sectionToggles;

        return elements;
    }
    initEvents() {
        this.input.initEvents(); // POPRAWKA: wywołanie input events
        return this.initEventHandlers();
    }

    // Kombinowane eventy z różnych modułów
    initEventHandlers() {
        // UI Events
        if(this.mapSelect) {
            this.mapSelect.addEventListener('change', async (e) => {
                if(e.target.value) {
                    await this.loadMap(e.target.value);
                    // Mgła zostanie załadowana w mapImage.onload po setupie canvas
                    await this.loadFogState();
                }
            });
        }

        // Map management events
        if(this.addMapBtn) {
            this.addMapBtn.addEventListener('click', () => this.ui.showAddMapDialog());
        }
        if(this.deleteMapBtn) {
            this.deleteMapBtn.addEventListener('click', () => this.ui.deleteCurrentMap());
        }

        // Grid area size input
        if(this.gridAreaSize) {
            this.gridAreaSize.addEventListener('change', (e) => {
                this.gridAreaSizeValue = parseInt(e.target.value) || 3;
            });
        }

        // Input events (mouse, keyboard, touch)
        this.input.initEvents();

        // Grid events
        this.toggleGridBtn.addEventListener('click', () => this.grid.toggleGrid());

        // Grid controls
        this.gridCountXInput.addEventListener('change', () => this.grid.calculateGridSizeFromCount());
        this.gridCountYInput.addEventListener('change', () => this.grid.calculateGridSizeFromCount());

        this.gridSizeInput.addEventListener('change', () => {
            const v = parseFloat(this.gridSizeInput.value);
            if(v > 0){
                this.gridSize = v;
                this.grid.drawGrid();
                this.gridStatus.textContent = `Siatka: ${this.gridSize.toFixed(1)}px (niezapisana)`;
            }
        });

        this.gridSizeInput.addEventListener('input', () => {
            const v = parseFloat(this.gridSizeInput.value);
            if(v > 0){
                this.gridSize = v;
                this.grid.drawGrid();
            }
        });

        // Grid offset controls
        this.gridOffsetXInput.addEventListener('change', () => {
            this.gridOffsetX = parseFloat(this.gridOffsetXInput.value) || 0;
            this.grid.drawGrid();
        });
        this.gridOffsetYInput.addEventListener('change', () => {
            this.gridOffsetY = parseFloat(this.gridOffsetYInput.value) || 0;
            this.grid.drawGrid();
        });
        this.gridLineWidthInput.addEventListener('change', () => {
            this.gridLineWidth = parseFloat(this.gridLineWidthInput.value) || 1.0;
            this.grid.drawGrid();
        });

        // Grid buttons
        this.saveGridBtn.addEventListener('click', () => this.grid.saveGridConfig());
        this.clearGridBtn.addEventListener('click', () => this.grid.clearGridConfig());

        // Calibration
        document.getElementById('startCalibrationBtn')?.addEventListener('click', () => this.grid.startGridCalibration());

        // Fog events
        if(this.paintFogBtn) {
            this.paintFogBtn.addEventListener('click', () => this.fog.toggleFogMode('paint'));
        }

        if(this.eraseFogBtn) {
            this.eraseFogBtn.addEventListener('click', () => this.fog.toggleFogMode('erase'));
        }

        if(this.resetFogBtn) {
            this.resetFogBtn.addEventListener('click', () => this.fog.resetFog());
        }

        // Fog color controls
        if(this.fogColorPickerView) {
            this.fogColorPickerView.addEventListener('change', () => this.fog.updateFogColorFromView());
        }
        if(this.fogOpacitySlider) {
            this.fogOpacitySlider.addEventListener('input', (e) => {
                // Ograniczenie wartości do zakresu 0-1 (0-100%)
                let value = parseFloat(e.target.value);
                value = Math.max(0, Math.min(1, value)); // Clamp between 0 and 1
                this.fogOpacity = value;

                // Zaktualizuj slider value jeśli było poza zakresem
                if (e.target.value != value) {
                    e.target.value = value;
                }

                if(this.fogOpacityValue) {
                    this.fogOpacityValue.textContent = Math.round(this.fogOpacity * 100) + '%';
                }
                this.fog.renderFog();
                this.saveMapSettings(); // Tylko settings, nie całe dane
            });
        }

        // Grid color controls
        if(this.gridColorPicker) {
            this.gridColorPicker.addEventListener('change', () => {
                this.gridColor = this.gridColorPicker.value;
                this.grid.drawGrid();
                this.saveMapSettings(); // Tylko settings, nie całe dane
            });
        }

        // Edytowalny zoom level (podgląd) - zapisywany w ustawieniach mapy
        if(this.zoomLevel && this.zoomLevel.tagName === 'INPUT') {
            this.zoomLevel.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                if (value >= 10 && value <= 500) {
                    this.viewport.setPreviewZoomPercent(value);
                }
            });
            this.zoomLevel.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const value = parseInt(e.target.value);
                    if (value >= 10 && value <= 500) {
                        this.viewport.setPreviewZoomPercent(value);
                    }
                }
            });
        }

        // Precise kontrolki zoom GM
        if(this.zoomInput) {
            this.zoomInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                if (value >= 10 && value <= 500) {
                    this.viewport.setGMZoomPercent(value);
                }
            });
            this.zoomInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const value = parseInt(e.target.value);
                    if (value >= 10 && value <= 500) {
                        this.viewport.setGMZoomPercent(value);
                    }
                }
            });
        }

        if(this.zoomDecrease1Btn) {
            this.zoomDecrease1Btn.addEventListener('click', () => this.viewport.adjustGMZoomByPercent(-1));
        }
        if(this.zoomIncrease1Btn) {
            this.zoomIncrease1Btn.addEventListener('click', () => this.viewport.adjustGMZoomByPercent(1));
        }

        // Preset zoom buttons GM
        if(this.zoom50Btn) {
            this.zoom50Btn.addEventListener('click', () => this.viewport.setGMZoomPercent(50));
        }
        if(this.zoom100Btn) {
            this.zoom100Btn.addEventListener('click', () => this.viewport.setGMZoomPercent(100));
        }
        if(this.zoom150Btn) {
            this.zoom150Btn.addEventListener('click', () => this.viewport.setGMZoomPercent(150));
        }
        if(this.zoom200Btn) {
            this.zoom200Btn.addEventListener('click', () => this.viewport.setGMZoomPercent(200));
        }

        this.navUpBtn.addEventListener('click', () => this.viewport.navigate('up'));
        this.navDownBtn.addEventListener('click', () => this.viewport.navigate('down'));
        this.navLeftBtn.addEventListener('click', () => this.viewport.navigate('left'));
        this.navRightBtn.addEventListener('click', () => this.viewport.navigate('right'));
        this.navCenterBtn.addEventListener('click', () => this.viewport.centerView());

        // Rotation events
        this.rotateLeftBtn.addEventListener('click', () => this.viewport.rotateMap(-90));
        this.rotateRightBtn.addEventListener('click', () => this.viewport.rotateMap(90));
        if(this.rotatePreviewBtn) {
            this.rotatePreviewBtn.addEventListener('click', () => this.viewport.rotateMap(90));
        }
        if(this.rotatePreviewLeftBtn) {
            this.rotatePreviewLeftBtn.addEventListener('click', () => this.viewport.rotateMap(-90));
        }
        this.resetRotationBtn.addEventListener('click', () => this.viewport.resetRotation());

        // Character events
        if(this.addPlayerBtn) {
            this.addPlayerBtn.addEventListener('click', () => this.charactersManager.toggleCharacterMode('player'));
        }
        if(this.addEnemyBtn) {
            this.addEnemyBtn.addEventListener('click', () => this.charactersManager.toggleCharacterMode('enemy'));
        }
        if(this.moveCharacterBtn) {
            this.moveCharacterBtn.addEventListener('click', () => this.toggleMoveCharacterMode());
        }
        if(this.removeCharacterBtn) {
            this.removeCharacterBtn.addEventListener('click', () => this.charactersManager.toggleCharacterMode('remove'));
        }
        if(this.removeLastPlayerBtn) {
            this.removeLastPlayerBtn.addEventListener('click', () => this.charactersManager.removeLastCharacter('player'));
        }
        if(this.removeAllPlayersBtn) {
            this.removeAllPlayersBtn.addEventListener('click', () => this.charactersManager.removeAllCharacters('player'));
        }
        if(this.removeLastEnemyBtn) {
            this.removeLastEnemyBtn.addEventListener('click', () => this.charactersManager.removeLastCharacter('enemy'));
        }
        if(this.removeAllEnemiesBtn) {
            this.removeAllEnemiesBtn.addEventListener('click', () => this.charactersManager.removeAllCharacters('enemy'));
        }

        // Character color events
        if(this.playerColorPicker) {
            this.playerColorPicker.addEventListener('change', () => {
                this.playerColor = this.playerColorPicker.value;
                this.drawCharacters();
                this.saveMapSettings(); // Tylko settings, nie całe dane
            });
        }
        if(this.enemyColorPicker) {
            this.enemyColorPicker.addEventListener('change', () => {
                this.enemyColor = this.enemyColorPicker.value;
                this.drawCharacters();
                this.saveMapSettings(); // Tylko settings, nie całe dane
            });
        }

        // Sidebar events
        if(this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => this.ui.toggleSidebar());
        }

        // Section toggles
        this.sectionToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const sectionToggle = e.target.closest('.section-toggle');
                if(sectionToggle) {
                    // Toggle collapsed class on section-toggle itself
                    sectionToggle.classList.toggle('collapsed');

                    // Find corresponding section-content and toggle expanded
                    const targetId = sectionToggle.getAttribute('data-target');
                    const sectionContent = document.getElementById(targetId);
                    if(sectionContent) {
                        sectionContent.classList.toggle('expanded');
                    }
                }
            });
        });

        // Preview map button (zmodyfikowany - z wymuszeniem odświeżenia)
        const setPreviewBtn = document.getElementById('setPreviewMapBtn');
        if(setPreviewBtn) {
            setPreviewBtn.addEventListener('click', async () => {
                const mapName = this.mapSelect?.value;
                if(!mapName) {
                    alert('Wybierz mapę z listy przed wczytaniem podglądu!');
                    return;
                }

                try {
                    console.log('🔄 Wczytaj podgląd: Rozpoczynam proces dla mapy:', mapName);

                    // PIERWSZY: Wymuś pełne odświeżenie podglądu (więcej metod)
                    console.log('📺 Wymuszam pełne odświeżenie podglądu...');

                    // Metoda 1: Standardowy refresh endpoint
                    await fetch('/api/preview-map/refresh', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ action: 'refresh', force: true })
                    }).catch(err => console.log('⚠️ Refresh endpoint nie odpowiadał:', err.message));

                    // Metoda 2: Wyczyść aktualną mapę podglądu
                    await fetch('/api/preview-map/clear', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ action: 'clear' })
                    }).catch(err => console.log('⚠️ Clear endpoint nie odpowiadał:', err.message));

                    // Metoda 3: Wyślij komendę przeładowania przez nawigację
                    await fetch('/api/preview-map/navigation', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ action: 'reload-page' })
                    }).catch(err => console.log('⚠️ Navigation reload nie odpowiadał:', err.message));

                    // Opóźnienie dla odświeżenia (zwiększone)
                    console.log('⏳ Czekam na przeładowanie podglądu...');
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // DRUGI: Ustaw nową mapę podglądu
                    console.log('🗺️ Ustawiam NOWĄ mapę podglądu:', mapName);
                    const mapResponse = await fetch('/api/preview-map', {
                        method: 'POST',
                        headers: {'Content-Type': 'text/plain'},
                        body: mapName
                    });

                    if (!mapResponse.ok) {
                        throw new Error(`Błąd ustawiania mapy: ${mapResponse.status}`);
                    }

                    console.log('✅ Mapa ustawiona pomyślnie');

                    // TRZECI: Konfiguruj podgląd z aktualnymi ustawieniami GM
                    console.log('⚙️ Synchronizuję ustawienia z GM...');

                    // Włącz tryb zdalnego sterowania
                    this.previewViewportVisible = false; // Ramka ukryta
                    this.previewRotation = 0; // Reset obrotu podglądu przy wczytaniu
                    this.remotePreviewControl = true; // Aktywuj tryb zdalnego sterowania podglądem

                    if (this.viewport) {
                        this.viewport.startPreviewViewportPolling(); // Viewport działa ale jest ukryty
                        // Wyślij aktualny viewport (ukryty)
                        setTimeout(() => this.viewport.reportCurrentViewport(), 200);
                    }

                    // Wyślij aktualny obrót mapy do podglądu
                    if (this.rotation && this.rotation !== 0) {
                        console.log('🔄 Synchronizuję obrót mapy:', this.rotation + '°');
                        await fetch('/api/preview-map/navigation', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'rotate', rotation: this.rotation })
                        }).catch(err => console.log('⚠️ Błąd synchronizacji obrotu:', err));
                    }

                    // Wyślij postacie jeśli są
                    if (this.characters && (this.characters.players.length || this.characters.enemies.length)) {
                        console.log('👥 Wysyłam postacie do podglądu...');
                        await this.sendCharactersToPreview(mapName);
                    }

                    // CZWARTY: Ostateczna weryfikacja
                    setTimeout(async () => {
                        try {
                            const statusResponse = await fetch('/api/preview-map/status');
                            if (statusResponse.ok) {
                                const status = await statusResponse.json();
                                console.log('📊 Status podglądu:', status);
                                if (status.currentMap === mapName) {
                                    console.log('✅ Podgląd został pomyślnie przeładowany na mapę:', mapName);
                                } else {
                                    console.warn('⚠️ Podgląd może nie być zsynchronizowany. Oczekiwano:', mapName, 'Otrzymano:', status.currentMap);
                                }
                            }
                        } catch (verifyError) {
                            console.log('⚠️ Nie udało się zweryfikować statusu podglądu:', verifyError.message);
                        }
                    }, 1500);

                } catch (err) {
                    console.error('❌ Błąd podczas inicjalizacji podglądu:', err);
                    alert('Błąd podczas wczytywania podglądu: ' + err.message);
                }
            });
        }

        // Refresh fog button - nowy przycisk pod Wczytaj podgląd
        const refreshFogBtn = document.getElementById('refreshFogBtn');
        if(refreshFogBtn) {
            refreshFogBtn.addEventListener('click', async () => {
                console.log('🌫️ Odśwież mgłę: Wysyłam żądanie odświeżenia...');
                try {
                    await fetch('/api/preview-map/refresh-fog', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ action: 'refresh-fog' })
                    });
                    console.log('✅ Żądanie odświeżenia mgły zostało wysłane');
                } catch (err) {
                    console.error('❌ Błąd odświeżenia mgły:', err);
                }
            });
        }
    }

    // Metody delegowane do odpowiednich menedżerów
    toggleGrid() { return this.grid.toggleGrid(); }
    drawGrid() { return this.grid.drawGrid(); }
    getGridCell(x, y) { return this.grid.getGridCell(x, y); }
    updateHighlight(e) { return this.grid.updateHighlight(e); }
    clearHighlight() { return this.grid.clearHighlight(); }

    toggleFogMode(mode) { return this.fog.toggleFogMode(mode); }
    paintFogAtPosition(x, y, radius) { return this.fog.paintFogAtPosition(x, y, radius); }
    eraseFogAtPosition(x, y, radius) { return this.fog.eraseFogAtPosition(x, y, radius); }
    paintFogGridArea(x, y) { return this.fog.paintFogGridArea(x, y); }
    eraseFogGridArea(x, y) { return this.fog.eraseFogGridArea(x, y); }
    loadFogState() { return this.fog.loadFogState(); }
    saveFogState() { return this.fog.saveFogState(); }
    flushPending() { return this.fog.flushPending ? this.fog.flushPending() : this._flushPending(); }

    toggleCharacterMode(mode) { return this.charactersManager.toggleCharacterMode(mode); }
    handleCharacterClick(e) { return this.charactersManager.handleCharacterClick(e); }
    handleCharacterDrop(e) { return this.charactersManager.handleCharacterDrop(e); }
    drawCharacters() { return this.charactersManager.drawCharacters(); }
    saveCharacters() { return this.charactersManager.saveCharacters(); }
    loadCharacters() { return this.charactersManager.loadCharacters(); }

    updateCursor() { return this.ui.updateCursor(); }
    updateZoomDisplay() { return this.viewport.updateZoomDisplay(); }
    updateRotationDisplay() { return this.viewport.updateRotationDisplay(); }

    toggleMoveCharacterMode() {
        // Wyłącz wszystkie tryby najpierw
        if (this.addPlayerBtn) this.addPlayerBtn.classList.remove('active');
        if (this.addEnemyBtn) this.addEnemyBtn.classList.remove('active');
        if (this.removeCharacterBtn) this.removeCharacterBtn.classList.remove('active');
        if (this.moveCharacterBtn) this.moveCharacterBtn.classList.remove('active');

        // Reset character mode
        this.characterMode = null;

        // Toggle move mode (isShiftPressed dla tablet/touchpad)
        this.isShiftPressed = !this.isShiftPressed;

        if (this.isShiftPressed && this.moveCharacterBtn) {
            this.moveCharacterBtn.classList.add('active');
        }

        this.updateCursor();
    }

    startViewportPolling() { return this.viewport.startViewportPolling(); }
    stopViewportPolling() { return this.viewport.stopViewportPolling(); }
    async drawPreviewViewport() { return await this.viewport.drawPreviewViewport(); }

    // Fallback metoda dla flushPending jeśli nie jest w fog module
    async _flushPending() {
        if (this.pendingFogPoints.length === 0) return;
        const pts = [...this.pendingFogPoints];
        this.pendingFogPoints = [];
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }

        if (!this.currentMap) return;

        try {
            const response = await fetch(`/api/fog/${this.currentMap.name}/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pts)
            });

            if (!response.ok) {
                console.error('ERROR Fog save batch error:', await response.text());
            }
        } catch (error) {
            console.error('ERROR Fog save batch error:', error);
        }
    }

    startAutoSave() {
        // if (this.autoSaveInterval) {
        //     clearInterval(this.autoSaveInterval);
        // }
        // this.autoSaveInterval = setInterval(() => {
        //     this.autoSaveAllSettings();
        // }, 30000);
    }

    async autoSaveAllSettings() {
        if (!this.currentMap) return;

        console.log('🕒 autoSaveAllSettings() - używa TYLKO saveMapSettings (bezpieczne dla mgły)');

        try {
            // ZMIANA: Używaj TYLKO saveMapSettings zamiast saveAllMapData
            // To zapobiega nadpisywaniu sekcji fog
            await this.saveMapSettings();

            // Zapisz grid/characters osobno jeśli potrzeba
            if (this.grid && this.grid.saveGridConfig) {
                await this.grid.saveGridConfig();
            }
            if (this.charactersManager && this.charactersManager.saveCharacters) {
                await this.saveCharacters();
            }

            // Mgła jest zapisywana osobno przez FogService - nie dotykamy jej
            console.log('✅ autoSaveAllSettings() zakończone - mgła nietknięta');

        } catch (error) {
            console.error('❌ Auto-save error:', error);
        }
    }

    clearOldFogDataFromLocalStorage() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('fog_state_')) {
                localStorage.removeItem(key);
                // Usunięto log sprzątania
            }
        });
    }

    updateWrapperCentering() {
        if (!this.mapWrapper || !this.currentMap) return;
        const cw = this.mapContainer.clientWidth;
        const ch = this.mapContainer.clientHeight;
        const mw = this.currentMap.width;
        const mh = this.currentMap.height;
        if (!mw || !mh) return;
        // Wycentruj wrapper aby transform-origin 50% 50% odpowiadał środkowi kontenera
        const left = (cw - mw) / 2;
        const top = (ch - mh) / 2;
        this.mapWrapper.style.position = 'absolute';
        this.mapWrapper.style.left = left + 'px';
        this.mapWrapper.style.top = top + 'px';
        this.mapWrapper.style.width = mw + 'px';
        this.mapWrapper.style.height = mh + 'px';
    }

    applyTransform() {
        if (!this.mapWrapper || !this.currentMap) return;
        this.updateWrapperCentering();

        // Transform-origin tak jak w podglądzie: środek kontenera względem wrappera
        const cw = this.mapContainer.clientWidth;
        const ch = this.mapContainer.clientHeight;
        const mw = this.currentMap.width;
        const mh = this.currentMap.height;

        if (!mw || !mh || !cw || !ch) return; // Sprawdź czy wymiary są poprawne

        const wrapperLeft = (cw - mw) / 2;
        const wrapperTop = (ch - mh) / 2;
        const originX = cw / 2 - wrapperLeft;
        const originY = ch / 2 - wrapperTop;

        this.mapWrapper.style.transformOrigin = `${originX}px ${originY}px`;

        // Kolejność transformacji jak w podglądzie: translate -> scale -> rotate
        let transform = `translate(${this.panOffset.x}px, ${this.panOffset.y}px)`;
        transform += ` scale(${this.zoom})`;
        if (this.rotation !== 0) {
            transform += ` rotate(${this.rotation}deg)`;
        }

        this.mapWrapper.style.transform = transform;
    }

    // Pozostałe metody z oryginalnego app.js
    async loadMapsList() {
        if (!this.mapSelect) {
            console.error('ERROR: mapSelect element not found!');
            return;
        }
        try {
            const response = await fetch('/api/maps');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const maps = await response.json();

            this.mapSelect.innerHTML = '<option value="">-- Wybierz mapę --</option>';
            maps.forEach(map => {
                const option = document.createElement('option');
                option.value = map.name;
                option.textContent = map.name;
                this.mapSelect.appendChild(option);
            });
        } catch (error) {
            console.error('❌ Error loading maps list:', error);

            // Dodaj testowe mapy dla debugowania
            this.mapSelect.innerHTML = '<option value="">-- Wybierz mapę --</option>';
            const testMaps = [
                { name: 'Test' },
                { name: 'Zamek' }
            ];

            testMaps.forEach(map => {
                const option = document.createElement('option');
                option.value = map.name;
                option.textContent = map.name + ' (test)';
                this.mapSelect.appendChild(option);
            });
        }
    }

    async loadMap(name) {
        if (!name) return;
        try {
            const res = await fetch(`/api/maps/${name}`);
            const mapData = await res.json();

            this.currentMap = mapData;
            this.mapImage.src = `/api/map-files/${mapData.filename}`;

            this.mapImage.onload = async () => {
                try {
                    this.currentMap.width = this.mapImage.naturalWidth;
                    this.currentMap.height = this.mapImage.naturalHeight;
                    if (this.currentMap.width <= 0 || this.currentMap.height <= 0) return;
                    this.mapImage.classList.remove('hidden');
                    this.fogCanvas.classList.remove('hidden');
                    this.gridCanvas.classList.remove('hidden');
                    this.calibrationCanvas.classList.remove('hidden');
                    if (this.viewportOverlayCanvas) this.viewportOverlayCanvas.classList.remove('hidden');
                    if (this.charactersCanvas) this.charactersCanvas.classList.remove('hidden');
                    if (this.charactersCanvas) this.charactersCanvas.style.zIndex = '50';
                    this.setupCanvases();
                    this.updateWrapperCentering(); // NOWE: centrowanie po załadowaniu obrazu

                    // Najpierw spróbuj załadować wszystkie dane z jednego pliku
                    const loadedFromFile = await this.loadAllMapData();

                    if (!loadedFromFile) {
                        // Fallback: załaduj ze starych endpointów
                        await this.loadMapSettings();
                        await this.grid.loadGridConfig();
                        await this.loadFogState();
                        await this.loadCharacters();
                    } else {
                        // Dane załadowane z pliku, załaduj tylko mgłę z serwera
                        await this.loadFogState();
                    }

                    // Zastosuj załadowane ustawienia
                    this.applyTransform();
                    this.updateZoomDisplay();
                    this.updateRotationDisplay();
                    this.grid.drawGrid();
                    this.drawCharacters();

                    // Na końcu ustaw viewport i synchronizację
                    this.viewport.resetZoom();
                    this.fog.startFogSynchronization();

                    setTimeout(() => { this.drawPreviewViewport().catch(()=>{}); }, 100);
                    setTimeout(() => { this.drawPreviewViewport().catch(()=>{}); }, 500);
                } catch (error) {
                    console.error('❌ Error in mapImage.onload:', error);
                }
            };

            this.mapImage.onerror = () => {
                console.error('❌ Error loading image:', this.mapImage.src);
            };

        } catch (e) {
            console.error('❌ Błąd ładowania mapy:', e);
        }
    }

    setupCanvases() {
        if (!this.currentMap) {
            console.error('No currentMap available for setupCanvases');
            return;
        }

        // Sprawdź czy mapa ma poprawne wymiary
        if (!this.currentMap.width || !this.currentMap.height || this.currentMap.width <= 0 || this.currentMap.height <= 0) {
            console.error('Invalid fog layer dimensions:', this.currentMap.width, this.currentMap.height);
            // Spróbuj pobrać wymiary z obrazu jeśli są dostępne
            if (this.mapImage && this.mapImage.naturalWidth > 0) {
                this.currentMap.width = this.mapImage.naturalWidth;
                this.currentMap.height = this.mapImage.naturalHeight;
                // Usunięto log naprawy wymiarów
            } else {
                console.error('Cannot fix dimensions - no valid image data');
                return;
            }
        }

        try {
            // Setup fog canvas
            this.fogCanvas.width = this.currentMap.width;
            this.fogCanvas.height = this.currentMap.height;
            this.fogCanvas.style.width = this.currentMap.width + 'px';
            this.fogCanvas.style.height = this.currentMap.height + 'px';

            // Setup grid canvas
            this.gridCanvas.width = this.currentMap.width;
            this.gridCanvas.height = this.currentMap.height;
            this.gridCanvas.style.width = this.currentMap.width + 'px';
            this.gridCanvas.style.height = this.currentMap.height + 'px';

            // Setup calibration canvas
            this.calibrationCanvas.width = this.currentMap.width;
            this.calibrationCanvas.height = this.currentMap.height;
            this.calibrationCanvas.style.width = this.currentMap.width + 'px';
            this.calibrationCanvas.style.height = this.currentMap.height + 'px';

            // Setup viewport overlay canvas
            if (this.viewportOverlayCanvas) {
                this.viewportOverlayCanvas.width = this.currentMap.width;
                this.viewportOverlayCanvas.height = this.currentMap.height;
                this.viewportOverlayCanvas.style.width = this.currentMap.width + 'px';
                this.viewportOverlayCanvas.style.height = this.currentMap.height + 'px';
            }

            // Usunięto log
            this.charactersManager.setupCharactersCanvas();
        } catch (error) {
            console.error('Error in setupCanvases:', error);
        }
    }

    async saveMapSettings() {
        if (!this.currentMap) return;

        const settings = {
            zoom: this.zoom,
            panX: this.panOffset.x,
            panY: this.panOffset.y,
            rotation: this.rotation,
            fogColor: this.fogColor,
            fogOpacity: this.fogOpacity,
            gridColor: this.gridColor,
            gridOpacity: this.gridOpacity,
            gridLineWidth: this.gridLineWidth,
            previewViewportColor: this.previewViewportColor,
            previewViewportVisible: this.previewViewportVisible
        };

        try {
            const response = await fetch(`/api/settings/${encodeURIComponent(this.currentMap.name)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (!response.ok) {
                console.error('❌ Settings save error:', await response.text());
            }
        } catch (error) {
            console.error('❌ Settings save error:', error);
        }
    }

    async loadMapSettings() {
        if (!this.currentMap) return;

        try {
            const response = await fetch(`/api/settings/${encodeURIComponent(this.currentMap.name)}`);
            if (response.ok) {
                const text = await response.text();
                if (text && text.trim().length > 0) {
                    const settings = JSON.parse(text);
                    this.zoom = settings.zoom || 1;
                    this.panOffset.x = settings.panX || 0;
                    this.panOffset.y = settings.panY || 0;
                    this.rotation = settings.rotation || 0;
                    this.fogColor = settings.fogColor || '#808080';
                    this.fogOpacity = settings.fogOpacity || 0.65;
                    this.gridColor = settings.gridColor || '#ffffff';
                    this.gridOpacity = settings.gridOpacity || 0.35;
                    this.gridLineWidth = settings.gridLineWidth || 1.0;
                    this.previewViewportColor = settings.previewViewportColor || '#ff0000';
                    this.previewViewportVisible = settings.previewViewportVisible !== false;

                    if (this.fogColorPickerView) this.fogColorPickerView.value = this.fogColor;
                    if (this.fogOpacitySlider) this.fogOpacitySlider.value = this.fogOpacity;
                    if (this.fogOpacityValue) this.fogOpacityValue.textContent = Math.round(this.fogOpacity * 100) + '%';
                    if (this.gridColorPicker) this.gridColorPicker.value = this.gridColor;

                    this.applyTransform();
                    this.updateZoomDisplay();
                    this.updateRotationDisplay();
                }
            }
        } catch (error) {
            console.error('ERROR Map settings load error:', error);
        }
    }

    scheduleFlush() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.flushPending(), 400);
    }

    queueCell(x, y, action = 'erase') {
        const cellKey = `${Math.round(x)},${Math.round(y)}`;
        const alreadyQueued = this.pendingFogPoints.some(p => {
            const px = Math.round(p.x - this.gridSize / 2);
            const py = Math.round(p.y - this.gridSize / 2);
            return px === Math.round(x) && py === Math.round(y) && p.action === action;
        });

        if (alreadyQueued) return;

        if (action === 'erase') {
            this.revealedCells.add(cellKey);
            this.paintedCells.delete(cellKey);
        } else {
            this.paintedCells.add(cellKey);
            this.revealedCells.delete(cellKey);
        }

        this.pendingFogPoints.push({
            x: x + this.gridSize / 2,
            y: y + this.gridSize / 2,
            radius: this.gridSize / 2,
            isGridCell: true,
            action: action
        });

        // NAPRAWKA: Oznacz czas lokalnej zmiany dla synchronizacji
        this.lastLocalFogChange = Date.now();

        if (this.pendingFogPoints.length >= 30) this.flushPending();
        else this.scheduleFlush();
    }

    handleCalibrationClick(e) {
        return this.grid.handleCalibrationClick(e);
    }

    renderCalibrationOverlay() {
        return this.grid.renderCalibrationOverlay();
    }

    // Metoda do obsługi touch events w InputManager
    getTouchPos(touch) {
        return this.input.getTouchPos ? this.input.getTouchPos(touch) : this.getMousePos(touch);
    }

    getMousePos(e) {
        if (!this.currentMap) return {x: 0, y: 0};
        const rect = this.mapContainer.getBoundingClientRect();
        const cw = this.mapContainer.clientWidth;
        const ch = this.mapContainer.clientHeight;
        const mw = this.currentMap.width;
        const mh = this.currentMap.height;

        // Pozycja wrappera (wycentrowanego w kontenerze)
        const wrapperLeft = (cw - mw) / 2;
        const wrapperTop = (ch - mh) / 2;

        // Transform-origin wrappera to środek kontenera względem wrappera
        const originX = cw / 2 - wrapperLeft;
        const originY = ch / 2 - wrapperTop;

        // Pozycja kursora względem lewego górnego rogu wrappera
        let x = e.clientX - rect.left - wrapperLeft;
        let y = e.clientY - rect.top - wrapperTop;

        const rawX = x, rawY = y; // Debug: zapamiętaj surowe współrzędne

        // Cofnij transformacje w kolejności zgodnej z podglądem:
        // Forward: translate -> scale -> rotate
        // Backward: cofnij translate -> cofnij rotate -> cofnij scale

        // 1. Cofnij translate (panOffset)
        x -= this.panOffset.x;
        y -= this.panOffset.y;

        // 2. Przesuń do transform-origin
        x -= originX;
        y -= originY;

        // 3. Cofnij rotate
        if (this.rotation !== 0) {
            const angle = -this.rotation * Math.PI / 180;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const rx = x * cos - y * sin;
            const ry = x * sin + y * cos;
            x = rx; y = ry;
        }

        // 4. Cofnij scale
        x /= this.zoom;
        y /= this.zoom;

        // 5. Powrót do współrzędnych obrazu
        x += originX;
        y += originY;


        return { x, y };
    }

    async sendCharactersToPreview(mapName) {
        if (!mapName) return;
        const data = {
            characters: {
                players: this.characters.players,
                enemies: this.characters.enemies
            },
            enemyLetterCounter: this.enemyLetterCounter,
            playerColor: this.playerColor,
            enemyColor: this.enemyColor
        };
        try {
            await fetch(`/api/characters/${encodeURIComponent(mapName)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.error('Error sending characters to preview:', e);
        }
    }

    // Zunifikowany system zapisywania/ładowania wszystkich danych mapy
    async saveAllMapData() {
        // BARDZO WIDOCZNY TEST - czy nowa wersja zostaje załadowana
        console.log('🔥🔥🔥🔥🔥 NOWA WERSJA saveAllMapData() - POPRAWKA FOG AKTYWNA! 🔥🔥🔥🔥🔥');
        console.log('🚨🚨🚨 METODA saveAllMapData() URUCHOMIONA!!! 🚨🚨🚨');
        console.log('🚨 saveAllMapData() WYWOŁANE dla mapy:', this.currentMap?.name);

        if (!this.currentMap) {
            console.log('❌ saveAllMapData() - brak currentMap');
            return;
        }

        console.log('💾 saveAllMapData START - zachowuję sekcję fog');

        // KROK 1: Pobierz istniejące dane żeby zachować sekcję fog
        console.log('🔍 Rozpoczynam pobieranie istniejących danych...');
        let existingData = null;
        try {
            const url = `/api/map-data/${encodeURIComponent(this.currentMap.name)}`;
            console.log('📡 Wywołuję GET:', url);
            const response = await fetch(url);
            console.log('📡 Odpowiedź GET - status:', response.status, 'ok:', response.ok);

            if (response.ok) {
                existingData = await response.json();
                console.log('📖 Pobrano istniejące dane, klucze:', Object.keys(existingData || {}));
                if (existingData && existingData.fog) {
                    console.log('✅ Istniejące dane ZAWIERAJĄ sekcję fog!');
                } else {
                    console.log('❌ Istniejące dane NIE zawierają sekcji fog');
                }
            } else {
                console.log('❌ Błąd odpowiedzi GET:', response.status);
            }
        } catch (err) {
            console.warn('⚠️ Nie udało się pobrać istniejących danych:', err);
        }

        const allData = {
            // Ustawienia mapy
            settings: {
                zoom: this.zoom,
                panX: this.panOffset.x,
                panY: this.panOffset.y,
                rotation: this.rotation,
                fogColor: this.fogColor,
                fogOpacity: this.fogOpacity,
                gridColor: this.gridColor,
                gridOpacity: this.gridOpacity,
                gridLineWidth: this.gridLineWidth,
                previewViewportColor: this.previewViewportColor,
                previewViewportVisible: this.previewViewportVisible,
                previewZoom: this.previewZoom || 100
            },

            // Ustawienia siatki
            grid: {
                size: this.gridSize,
                offsetX: this.gridOffsetX,
                offsetY: this.gridOffsetY,
                visible: this.gridVisible,
                lineWidth: this.gridLineWidth,
                color: this.gridColor,
                opacity: this.gridOpacity
            },

            // Postacie
            characters: {
                players: this.characters.players,
                enemies: this.characters.enemies,
                enemyLetterCounter: this.enemyLetterCounter,
                playerColor: this.playerColor,
                enemyColor: this.enemyColor
            },

            // Metadane
            timestamp: new Date().toISOString(),
            version: "1.0"
        };

        // KROK 2: Zachowaj istniejącą sekcję fog jeśli istnieje
        console.log('🔍 Sprawdzam czy zachować sekcję fog...');
        console.log('   existingData:', !!existingData);
        console.log('   existingData.fog:', !!(existingData && existingData.fog));

        if (existingData && existingData.fog) {
            allData.fog = existingData.fog;
            console.log('✅ ZACHOWANO sekcję fog z istniejących danych!');
            console.log('   Liczba obszarów fog:', existingData.fog.revealedAreas?.length || 0);
        } else {
            console.log('❌ BRAK sekcji fog w istniejących danych - nie ma co zachować!');
            if (existingData) {
                console.log('   Istniejące dane mają klucze:', Object.keys(existingData));
            }
        }

        try {
            // Zapisz do pliku na serwerze
            console.log('💾 Zapisuję dane z kluczami:', Object.keys(allData));
            const response = await fetch(`/api/map-data/${encodeURIComponent(this.currentMap.name)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(allData)
            });

            if (!response.ok) {
                console.error('❌ Map data save error:', await response.text());
                return false;
            }

            console.log('✅ saveAllMapData SUCCESS - dane zapisane');
            return true;
        } catch (error) {
            console.error('❌ Map data save error:', error);
            return false;
        }
    }

    async loadAllMapData() {
        if (!this.currentMap) return false;

        try {
            const response = await fetch(`/api/map-data/${encodeURIComponent(this.currentMap.name)}`);
            if (!response.ok) {
                if (response.status === 404) {
                    return false;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const allData = await response.json();

            // Załaduj ustawienia mapy
            if (allData.settings) {
                this.zoom = allData.settings.zoom || 1;
                this.panOffset.x = allData.settings.panX || 0;
                this.panOffset.y = allData.settings.panY || 0;
                this.rotation = allData.settings.rotation || 0;
                this.fogColor = allData.settings.fogColor || '#808080';
                this.fogOpacity = allData.settings.fogOpacity || 0.65;
                this.gridColor = allData.settings.gridColor || '#ffffff';
                this.gridOpacity = allData.settings.gridOpacity || 0.35;
                this.gridLineWidth = allData.settings.gridLineWidth || 1.0;
                this.previewViewportColor = allData.settings.previewViewportColor || '#ff0000';
                this.previewViewportVisible = allData.settings.previewViewportVisible !== false;
                this.previewZoom = allData.settings.previewZoom || 100;

                // Aktualizuj kontrolki
                if (this.fogColorPickerView) this.fogColorPickerView.value = this.fogColor;
                if (this.fogOpacitySlider) this.fogOpacitySlider.value = this.fogOpacity;
                if (this.fogOpacityValue) this.fogOpacityValue.textContent = Math.round(this.fogOpacity * 100) + '%';
                if (this.gridColorPicker) this.gridColorPicker.value = this.gridColor;

                // Aktualizuj kontrolki zoom - zostawi updateZoomDisplay()
                this.viewport.updateZoomDisplay();
            }

            // Załaduj ustawienia siatki
            if (allData.grid) {
                this.gridSize = allData.grid.size;
                this.gridOffsetX = allData.grid.offsetX || 0;
                this.gridOffsetY = allData.grid.offsetY || 0;
                this.gridVisible = allData.grid.visible || false;

                // Aktualizuj kontrolki siatki
                if (this.gridSizeInput) this.gridSizeInput.value = this.gridSize || '';
                if (this.gridOffsetXInput) this.gridOffsetXInput.value = this.gridOffsetX;
                if (this.gridOffsetYInput) this.gridOffsetYInput.value = this.gridOffsetY;
                if (this.gridLineWidthInput) this.gridLineWidthInput.value = this.gridLineWidth;
            }

            // Załaduj postacie
            if (allData.characters) {
                this.characters = allData.characters.players || allData.characters.enemies ?
                    { players: allData.characters.players || [], enemies: allData.characters.enemies || [] } :
                    { players: [], enemies: [] };
                this.enemyLetterCounter = allData.characters.enemyLetterCounter || 0;
                this.playerColor = allData.characters.playerColor || '#00ff00';
                this.enemyColor = allData.characters.enemyColor || '#ff0000';

                // Aktualizuj kontrolki kolorów
                if (this.playerColorPicker) this.playerColorPicker.value = this.playerColor;
                if (this.enemyColorPicker) this.enemyColorPicker.value = this.enemyColor;
            }

            return true;
        } catch (error) {
            console.error('❌ Map data load error:', error);
            return false;
        }
    }
}

// Funkcja do ładowania informacji o wersji
async function loadVersionInfo() {
    try {
        const response = await fetch('/api/version');
        if (response.ok) {
            const versionData = await response.json();

            // Aktualizuj elementy HTML jeśli istnieją
            const appVersionEl = document.getElementById('appVersion');
            const buildDateEl = document.getElementById('buildDate');

            if (appVersionEl) {
                appVersionEl.textContent = `1.${versionData.build || '1'}`;
            }

            if (buildDateEl) {
                buildDateEl.textContent = versionData.buildDate || '2025-01-17 00:00';
            }
        }
    } catch (error) {
        console.error('Failed to load version info:', error);
        // Zachowaj domyślne wartości w HTML
    }
}

// Inicjalizuj aplikację po załadowaniu DOM
document.addEventListener('DOMContentLoaded', () => {
    const initializeApp = (attempt = 1) => {
        console.log(`🚀 Próba inicjalizacji aplikacji #${attempt}...`);

        // Sprawdź dostępność wszystkich klas
        const requiredClasses = ['UIManager', 'InputManager', 'GridManager', 'FogManager', 'CharactersManager', 'ViewportManager'];
        const missingClasses = [];

        console.log('🔍 Sprawdzanie dostępności klas:');
        requiredClasses.forEach(className => {
            const isAvailable = typeof window[className] !== 'undefined';
            console.log(`   ${className}: ${isAvailable ? '✅' : '❌'} (typeof: ${typeof window[className]})`);
            if (!isAvailable) {
                missingClasses.push(className);
            }
        });

        if (missingClasses.length > 0) {
            console.warn(`⚠️ Brakuje klas: ${missingClasses.join(', ')}. Próba ${attempt}/5`);

            // Dodatkowe debugowanie dla ViewportManager
            if (missingClasses.includes('ViewportManager')) {
                console.log('🔍 DEBUG ViewportManager:');
                console.log('   window.ViewportManager:', window.ViewportManager);
                console.log('   typeof window.ViewportManager:', typeof window.ViewportManager);
                console.log('   Wszystkie klasy w window:', Object.keys(window).filter(key => key.includes('Manager')));
            }

            if (attempt < 5) {
                setTimeout(() => initializeApp(attempt + 1), 300); // Zwiększone z 100ms na 300ms
                return;
            } else {
                console.error('❌ KRYTYCZNY BŁĄD: Nie udało się załadować wszystkich klas po 5 próbach');
                console.error('❌ Spróbuję fallback inicjalizacji...');

                // FALLBACK - spróbuj załadować ViewportManager bezpośrednio
                if (missingClasses.includes('ViewportManager')) {
                    try {
                        // Sprawdź czy viewport.js w ogóle się załadował
                        console.log('🔍 FALLBACK: Sprawdzanie viewport.js');

                        // Może klasa jest zdefiniowana lokalnie ale nie eksportowana?
                        const script = document.querySelector('script[src="/js/viewport.js"]');
                        if (script) {
                            console.log('✅ viewport.js script tag exists');
                        } else {
                            console.log('❌ viewport.js script tag NOT FOUND');
                        }

                        // Sprawdź czy ViewportManager jest w jakiejkolwiek formie dostępny
                        console.log('🔍 Checking all ViewportManager variations:');
                        console.log('   ViewportManager:', typeof ViewportManager);
                        console.log('   window.ViewportManager:', typeof window.ViewportManager);
                        console.log('   globalThis.ViewportManager:', typeof globalThis.ViewportManager);

                        // Jeśli nadal nie ma ViewportManager, tworzymy prostą zaślepkę
                        if (typeof ViewportManager === 'undefined') {
                            console.warn('⚠️ Tworzę tymczasową zaślepkę ViewportManager');
                            window.ViewportManager = class ViewportManager {
                                constructor(viewer) {
                                    this.viewer = viewer;
                                    console.warn('⚠️ Używam zaślepki ViewportManager - funkcjonalność ograniczona');
                                }

                                // Podstawowe metody
                                clampPan() {}

                                // Metody zoom
                                async zoomIn() {}
                                async zoomOut() {}
                                async setGMZoomPercent(percent) {
                                    if (this.viewer && this.viewer.zoom !== undefined) {
                                        this.viewer.zoom = percent / 100;
                                    }
                                }
                                async resetZoom() {}
                                updateZoomDisplay() {
                                    // Fallback implementation
                                    if (this.viewer && this.viewer.zoomValueDisplay) {
                                        this.viewer.zoomValueDisplay.textContent = `${Math.round((this.viewer.zoom || 1) * 100)}%`;
                                    }
                                }

                                // Metody nawigacji
                                async pan() {}
                                async navigate() {}

                                // Metody obrotu
                                async rotate() {}
                                async resetRotation() {}

                                // Metody viewport
                                computeViewportFromTransform() { return null; }
                                reportCurrentViewport() {
                                    console.log('📍 Fallback reportCurrentViewport - brak implementacji');
                                }

                                // Metody polling
                                startViewportPolling() {}
                                stopViewportPolling() {}
                                startPreviewViewportPolling() {}

                                // Metody preview
                                async fetchPreviewViewport() {}
                                drawViewportOverlay() {}
                                async drawPreviewViewport() {}
                                drawServerViewportOverlay() {}

                                // Dodatkowe metody
                                async saveMapSettings() {}
                                sendRotationToPreview() {}
                                setPreviewZoom() {}
                                resetPreview() {}

                                // Właściwości
                                get serverViewport() { return null; }
                                set serverViewport(value) {}

                                get previewViewportPollingInterval() { return null; }
                                set previewViewportPollingInterval(value) {}
                            };
                            console.log('✅ Zaślepka ViewportManager utworzona');
                        }

                    } catch (fallbackError) {
                        console.error('❌ Fallback też nie zadziałał:', fallbackError);
                    }
                }

                // Spróbuj kontynuować mimo błędów
                console.warn('⚠️ Kontynuuję inicjalizację mimo brakujących klas...');
                // return; // Usuń return żeby kontynuować
            }
        }

        try {
            console.log('✅ Wszystkie klasy dostępne, uruchamiam DnDMapViewer...');
            window.viewer = new DnDMapViewer();
            window.viewer.loadMapsList();

            // Załaduj informacje o wersji
            loadVersionInfo();
        } catch (error) {
            console.error('ERROR: Error during DnDMapViewer initialization:', error);
        }
    };

    // Rozpocznij inicjalizację
    initializeApp();
});
