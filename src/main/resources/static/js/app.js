class DnDMapViewer {
    constructor(){
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
        this.fogMode = 'none'; // 'paint', 'erase', 'none'
        this.fogPollingInterval = null;
        this.lastFogStateHash = null;

        // Śledzenie już odkrytych komórek aby nie wysyłać ponownie
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
        this.previewViewportVisible = false;

        // Obrót mapy
        this.rotation = 0;

        // Postacie
        this.charactersCanvas = null;
        this.charactersCtx = null;
        this.characters = { players: [], enemies: [] };
        this.characterMode = null; // 'player' lub 'enemy'
        this.playerColor = '#00ff00';
        this.enemyColor = '#ff0000';
        this.draggingCharacter = null;
        this.enemyLetterCounter = 0;
        this.isShiftPressed = false; // Śledzenie klawisza Shift

        // Automatyczny zapis co 30 sekund
        this.autoSaveInterval = null;

        // Wyczyść stare dane mgły z localStorage (nie są już używane)
        this.clearOldFogDataFromLocalStorage();

        this.initElements();
        this.initEvents();
        this.startViewportPolling();
        this.startAutoSave(); // Uruchom automatyczny zapis
    }

    startAutoSave() {
        // Zapisuj wszystkie ustawienia co 30 sekund
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(() => {
            this.autoSaveAllSettings();
        }, 30000); // 30 sekund
    }

    async autoSaveAllSettings() {
        if (!this.currentMap) return;

        try {
            // 1. Zapisz ustawienia mapy (zoom, pan, kolory, etc.)
            await this.saveMapSettings();

            // 2. Zapisz mgłę (jeśli są zmiany)
            if (this.pendingFogPoints.length > 0) {
                await this.saveFogState();
            }

            // 3. Zapisz postacie
            await this.saveCharacters();
        } catch (error) {
            console.error('❌ Auto-save error:', error);
        }
    }

    clearOldFogDataFromLocalStorage() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('fog_')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
        } catch (e) {
            console.error('Error clearing old fog data:', e);
        }
    }

    initElements(){
        this.mapSelect = document.getElementById('mapSelect');
        this.addMapBtn = document.getElementById('addMapBtn');
        this.deleteMapBtn = document.getElementById('deleteMapBtn');
        this.mapImage = document.getElementById('mapImage');
        this.mapWrapper = document.getElementById('mapWrapper');
        this.mapContainer = document.getElementById('mapContainer');
        this.fogCanvas = document.getElementById('fogCanvas');
        this.fogCtx = this.fogCanvas.getContext('2d', { willReadFrequently: true });
        this.gridCanvas = document.getElementById('gridCanvas');
        this.gridCtx = this.gridCanvas.getContext('2d');
        this.calibrationCanvas = document.getElementById('calibrationCanvas');
        this.calibrationCtx = this.calibrationCanvas.getContext('2d');
        this.gridAreaSize = document.getElementById('gridAreaSize');
        this.resetFogBtn = document.getElementById('resetFogBtn');
        this.toggleGridBtn = document.getElementById('toggleGridBtn');
        this.gridStatus = document.getElementById('gridStatus');
        this.zoomInBtn = document.getElementById('zoomInBtn');
        this.zoomOutBtn = document.getElementById('zoomOutBtn');
        this.rotatePreviewBtn = document.getElementById('rotatePreviewBtn');
        this.zoomLevel = document.getElementById('zoomLevel');
        this.navUpBtn = document.getElementById('navUpBtn');
        this.navDownBtn = document.getElementById('navDownBtn');
        this.navLeftBtn = document.getElementById('navLeftBtn');
        this.navRightBtn = document.getElementById('navRightBtn');
        this.navCenterBtn = document.getElementById('navCenterBtn');
        this.gridCountXInput = document.getElementById('gridCountXInput');
        this.gridCountYInput = document.getElementById('gridCountYInput');
        this.gridSizeInput = document.getElementById('gridSizeInput');
        this.gridOffsetXInput = document.getElementById('gridOffsetXInput');
        this.gridOffsetYInput = document.getElementById('gridOffsetYInput');
        this.gridLineWidthInput = document.getElementById('gridLineWidthInput');
        this.saveGridBtn = document.getElementById('saveGridBtn');
        this.clearGridBtn = document.getElementById('clearGridBtn');
        this.paintFogBtn = document.getElementById('paintFogBtn');
        this.eraseFogBtn = document.getElementById('eraseFogBtn');

        // Nowe elementy kontrolek kolorów
        this.gridColorPicker = document.getElementById('gridColorPicker');

        // Dodatkowe kontrolki koloru mgły w sekcji widok
        this.fogColorPickerView = document.getElementById('fogColorPickerView');
        this.fogOpacitySlider = document.getElementById('fogOpacitySlider');
        this.fogOpacityValue = document.getElementById('fogOpacityValue');

        // Canvas dla viewportu podglądu
        this.previewViewportCanvas = document.getElementById('previewViewportCanvas');
        if (this.previewViewportCanvas) {
            this.previewViewportCtx = this.previewViewportCanvas.getContext('2d');
            // Ustaw początkowe wymiary viewport canvas
            this.previewViewportCanvas.width = 200;
            this.previewViewportCanvas.height = 150;
            this.previewViewportCanvas.style.width = '200px';
            this.previewViewportCanvas.style.height = '150px';
        }
        this.previewViewportColorPicker = document.getElementById('previewViewportColorPicker');
        this.togglePreviewViewportBtn = document.getElementById('togglePreviewViewportBtn');

        // Elementy obrotu mapy
        this.rotateLeftBtn = document.getElementById('rotateLeftBtn');
        this.rotateRightBtn = document.getElementById('rotateRightBtn');
        this.resetRotationBtn = document.getElementById('resetRotationBtn');
        this.rotationValue = document.getElementById('rotationValue');

        // Elementy modułu postaci
        this.charactersCanvas = document.getElementById('charactersCanvas');
        if (this.charactersCanvas) {
            this.charactersCtx = this.charactersCanvas.getContext('2d');
        }
        this.addPlayerBtn = document.getElementById('addPlayerBtn');
        this.addEnemyBtn = document.getElementById('addEnemyBtn');
        this.removeCharacterBtn = document.getElementById('removeCharacterBtn');
        this.removeLastPlayerBtn = document.getElementById('removeLastPlayerBtn');
        this.removeAllPlayersBtn = document.getElementById('removeAllPlayersBtn');
        this.removeLastEnemyBtn = document.getElementById('removeLastEnemyBtn');
        this.removeAllEnemiesBtn = document.getElementById('removeAllEnemiesBtn');
        this.playerColorPicker = document.getElementById('playerColorPicker');
        this.enemyColorPicker = document.getElementById('enemyColorPicker');

        // Nowe elementy dla bocznego panelu
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.sectionToggles = document.querySelectorAll('.section-toggle');

        // Inicjalizuj gridAreaSizeValue na końcu, gdy wszystkie elementy są załadowane
        if(this.gridAreaSize) {
            this.gridAreaSizeValue = parseInt(this.gridAreaSize.value) || 3;
        }
    }

    initEvents(){
        // Sprawdź czy elementy istnieją przed dodaniem event listenerów
        if(this.mapSelect) {
            this.mapSelect.addEventListener('change', e => {
                this.loadMap(e.target.value);

                // Odśwież postacie i mgłę po załadowaniu mapy
                setTimeout(() => {
                    this.loadCharacters();
                    this.loadFogState();
                }, 500); // Daj czas na załadowanie mapy
            });
        } else {
            console.error('mapSelect element not found');
        }

        // Event listenery dla zarządzania mapami
        if(this.addMapBtn) {
            this.addMapBtn.addEventListener('click', () => this.showAddMapDialog());
        }
        if(this.deleteMapBtn) {
            this.deleteMapBtn.addEventListener('click', () => this.deleteCurrentMap());
        }

        if(this.gridAreaSize) {
            // Ponownie zsynchronizuj wartość na początku initEvents
            this.gridAreaSizeValue = parseInt(this.gridAreaSize.value) || 3;

            this.gridAreaSize.addEventListener('change', e => {
                this.gridAreaSizeValue = parseInt(e.target.value);
            });
        }

        this.resetFogBtn.addEventListener('click', () => this.resetFog());
        this.zoomInBtn.addEventListener('click', () => this.sendPreviewNavigation('zoom', 'in'));
        this.zoomOutBtn.addEventListener('click', () => this.sendPreviewNavigation('zoom', 'out'));
        this.rotatePreviewBtn.addEventListener('click', () => this.rotatePreview());
        this.navUpBtn.addEventListener('click', () => this.sendPreviewNavigation('pan', 'up'));
        this.navDownBtn.addEventListener('click', () => this.sendPreviewNavigation('pan', 'down'));
        this.navLeftBtn.addEventListener('click', () => this.sendPreviewNavigation('pan', 'left'));
        this.navRightBtn.addEventListener('click', () => this.sendPreviewNavigation('pan', 'right'));
        this.navCenterBtn.addEventListener('click', () => this.sendPreviewNavigation('center', null));
        this.mapContainer.addEventListener('wheel', e => this.handleWheel(e));
        document.addEventListener('keydown', e => {
            if(e.key === 'Alt'){
                this.isAltPressed = true;
                this.updateCursor();
            }
            if(e.key === 'Shift'){
                this.isShiftPressed = true;
                this.updateCursor();
            }
        });
        document.addEventListener('keyup', e => {
            if(e.key === 'Alt'){
                this.isAltPressed = false;
                this.updateCursor();
                this.clearHighlight();
            }
            if(e.key === 'Shift'){
                this.isShiftPressed = false;
                this.draggingCharacter = null;
                this.updateCursor();
            }
        });
        this.mapContainer.addEventListener('mousedown', e => this.onMouseDown(e));
        this.mapContainer.addEventListener('mousemove', e => this.onMouseMove(e));
        this.mapContainer.addEventListener('mouseup', e => this.onMouseUp(e));
        this.mapContainer.addEventListener('mouseleave', () => this.onMouseLeave());
        ['dragstart', 'selectstart', 'contextmenu'].forEach(ev =>
            this.mapContainer.addEventListener(ev, evn => evn.preventDefault())
        );

        this.toggleGridBtn.addEventListener('click', () => this.toggleGrid());

        // Event listenery dla ilości kratek - automatyczne wyliczanie rozmiaru
        this.gridCountXInput.addEventListener('change', () => this.calculateGridSizeFromCount());
        this.gridCountYInput.addEventListener('change', () => this.calculateGridSizeFromCount());

        this.gridSizeInput.addEventListener('change', () => {
            const v = parseFloat(this.gridSizeInput.value);
            if(v > 0){
                this.gridSize = v;
                this.drawGrid();
                this.gridStatus.textContent = `Siatka: ${this.gridSize.toFixed(1)}px (niezapisana)`;
            }
        });
        // Również obsługuj input event dla natychmiastowej aktualizacji
        this.gridSizeInput.addEventListener('input', () => {
            const v = parseFloat(this.gridSizeInput.value);
            if(v > 0){
                this.gridSize = v;
                this.drawGrid();
            }
        });

        this.gridOffsetXInput.addEventListener('change', () => {
            this.gridOffsetX = parseFloat(this.gridOffsetXInput.value) || 0;
            this.drawGrid();
            this.gridStatus.textContent = `Siatka: ${this.gridSize || '?'}px (niezapisana)`;
        });
        this.gridOffsetXInput.addEventListener('input', () => {
            this.gridOffsetX = parseFloat(this.gridOffsetXInput.value) || 0;
            this.drawGrid();
        });

        this.gridOffsetYInput.addEventListener('change', () => {
            this.gridOffsetY = parseFloat(this.gridOffsetYInput.value) || 0;
            this.drawGrid();
            this.gridStatus.textContent = `Siatka: ${this.gridSize || '?'}px (niezapisana)`;
        });
        this.gridOffsetYInput.addEventListener('input', () => {
            this.gridOffsetY = parseFloat(this.gridOffsetYInput.value) || 0;
            this.drawGrid();
        });

        this.gridLineWidthInput.addEventListener('change', () => {
            this.gridLineWidth = parseFloat(this.gridLineWidthInput.value) || 1.0;
            this.drawGrid();
            this.gridStatus.textContent = `Siatka: ${this.gridSize || '?'}px (niezapisana)`;
        });
        this.gridLineWidthInput.addEventListener('input', () => {
            this.gridLineWidth = parseFloat(this.gridLineWidthInput.value) || 1.0;
            this.drawGrid();
        });

        // Przyciski zapisu i usuwania siatki
        this.saveGridBtn.addEventListener('click', () => this.saveGridConfig());
        this.clearGridBtn.addEventListener('click', () => this.clearGridConfig());

        this.paintFogBtn.addEventListener('click', () => this.toggleFogMode('paint'));
        this.eraseFogBtn.addEventListener('click', () => this.toggleFogMode('erase'));

        // Event listenery dla kontrolek koloru mgły w sekcji widok
        if(this.fogColorPickerView) {
            this.fogColorPickerView.addEventListener('change', () => this.updateFogColorFromView());
        }

        if(this.fogOpacitySlider) {
            this.fogOpacitySlider.addEventListener('input', (e) => {
                const opacity = e.target.value;
                this.fogOpacity = opacity / 100; // Konwersja z 0-100 na 0-1
                if(this.fogOpacityValue) {
                    this.fogOpacityValue.textContent = `${opacity}%`;
                }
                this.renderFog(); // Przerysuj mgłę z nową przezroczystością
                this.saveMapSettings(); // Zapisz ustawienia
            });
        }

        // Event listenery dla kontrolek kolorów siatki
        if(this.gridColorPicker) {
            this.gridColorPicker.addEventListener('change', () => this.updateGridColor());
        }

        // Event listenery dla viewport podglądu
        if(this.previewViewportColorPicker) {
            this.previewViewportColorPicker.addEventListener('change', () => this.updatePreviewViewportColor());
        }
        if(this.togglePreviewViewportBtn) {
            this.togglePreviewViewportBtn.addEventListener('click', () => this.togglePreviewViewport());
        }

        // Event listenery dla obrotu mapy
        if(this.rotateLeftBtn) {
            this.rotateLeftBtn.addEventListener('click', () => this.rotateMap(-90));
        }
        if(this.rotateRightBtn) {
            this.rotateRightBtn.addEventListener('click', () => this.rotateMap(90));
        }
        if(this.resetRotationBtn) {
            this.resetRotationBtn.addEventListener('click', () => this.resetRotation());
        }

        // Event listenery dla modułu postaci
        if(this.addPlayerBtn) {
            this.addPlayerBtn.addEventListener('click', () => this.toggleCharacterMode('player'));
        }
        if(this.addEnemyBtn) {
            this.addEnemyBtn.addEventListener('click', () => this.toggleCharacterMode('enemy'));
        }
        if(this.removeCharacterBtn) {
            this.removeCharacterBtn.addEventListener('click', () => this.toggleCharacterMode('remove'));
        }
        if(this.removeLastPlayerBtn) {
            this.removeLastPlayerBtn.addEventListener('click', () => this.removeLastCharacter('player'));
        }
        if(this.removeAllPlayersBtn) {
            this.removeAllPlayersBtn.addEventListener('click', () => this.removeAllCharacters('player'));
        }
        if(this.removeLastEnemyBtn) {
            this.removeLastEnemyBtn.addEventListener('click', () => this.removeLastCharacter('enemy'));
        }
        if(this.removeAllEnemiesBtn) {
            this.removeAllEnemiesBtn.addEventListener('click', () => this.removeAllCharacters('enemy'));
        }
        if(this.playerColorPicker) {
            this.playerColorPicker.addEventListener('change', (e) => {
                this.playerColor = e.target.value;
                this.drawCharacters();
                this.saveCharacters();
            });
        }
        if(this.enemyColorPicker) {
            this.enemyColorPicker.addEventListener('change', (e) => {
                this.enemyColor = e.target.value;
                this.drawCharacters();
                this.saveCharacters();
            });
        }

        // Obsługa bocznego panelu
        if(this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Obsługa sekcji otwierania/zamykania
        if(this.sectionToggles && this.sectionToggles.length > 0) {
            this.sectionToggles.forEach(toggle => {
                toggle.addEventListener('click', () => this.toggleSection(toggle));
            });
        }
    }

    toggleSidebar() {
        if(this.sidebar) {
            this.sidebar.classList.toggle('collapsed');
        }
    }

    toggleSection(toggle) {
        const targetId = toggle.getAttribute('data-target');
        const content = document.getElementById(targetId);
        const icon = toggle.querySelector('.toggle-icon');

        if (!content || !icon) {
            console.error('Section content or icon not found for:', targetId);
            return;
        }

        if (content.classList.contains('expanded')) {
            // Zamykanie sekcji
            content.classList.remove('expanded');
            toggle.classList.add('collapsed');
            icon.textContent = 'expand_more';
        } else {
            // Otwieranie sekcji
            content.classList.add('expanded');
            toggle.classList.remove('collapsed');
            icon.textContent = 'expand_less';
        }
    }

    // ===== ZARZĄDZANIE MAPAMI =====

    async loadMapsList() {
        try {
            const response = await fetch('/api/maps');
            if (!response.ok) {
                throw new Error('Nie można pobrać listy map');
            }

            const maps = await response.json();

            // Wyczyść select
            this.mapSelect.innerHTML = '<option value="">-- Wybierz mapę --</option>';

            // Dodaj mapy do selecta
            maps.forEach(map => {
                const option = document.createElement('option');
                option.value = map.name;
                option.textContent = map.name;
                this.mapSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Błąd wczytywania listy map:', error);
            alert('Nie można wczytać listy map. Sprawdź czy serwer działa.');
        }
    }

    showAddMapDialog() {
        const mapName = prompt('Podaj nazwę mapy:');
        if (!mapName || mapName.trim() === '') {
            return;
        }

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.uploadMap(mapName.trim(), file);
            }
        };
        fileInput.click();
    }

    async uploadMap(mapName, file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', mapName);

        try {
            const response = await fetch('/api/maps/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert(`Mapa "${mapName}" została dodana!`);
                // Odśwież listę map
                await this.loadMapsList();
            } else {
                const error = await response.text();
                alert(`Błąd podczas dodawania mapy: ${error}`);
            }
        } catch (error) {
            console.error('Error uploading map:', error);
            alert('Błąd podczas dodawania mapy');
        }
    }

    async deleteCurrentMap() {
        const mapName = this.mapSelect.value;
        if (!mapName) {
            alert('Wybierz mapę do usunięcia');
            return;
        }

        if (!confirm(`Czy na pewno chcesz usunąć mapę "${mapName}"?\nTa operacja jest nieodwracalna!`)) {
            return;
        }

        try {
            const response = await fetch(`/api/maps/${mapName}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert(`Mapa "${mapName}" została usunięta`);

                // Zatrzymaj synchronizację mgły
                this.stopFogSynchronization();

                // Wyczyść aktualnie wybraną mapę
                this.currentMap = null;
                this.fogState = null;
                this.characters = { players: [], enemies: [] };

                // Wyczyść wszystkie canvas
                if (this.fogCanvas) {
                    this.fogCtx.clearRect(0, 0, this.fogCanvas.width, this.fogCanvas.height);
                    this.fogCanvas.classList.add('hidden');
                }
                if (this.gridCanvas) {
                    this.gridCtx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
                    this.gridCanvas.classList.add('hidden');
                }
                if (this.calibrationCanvas) {
                    this.calibrationCtx.clearRect(0, 0, this.calibrationCanvas.width, this.calibrationCanvas.height);
                    this.calibrationCanvas.classList.add('hidden');
                }
                if (this.charactersCanvas) {
                    this.charactersCtx.clearRect(0, 0, this.charactersCanvas.width, this.charactersCanvas.height);
                    this.charactersCanvas.classList.add('hidden');
                }
                if (this.previewViewportCanvas) {
                    this.previewViewportCtx.clearRect(0, 0, this.previewViewportCanvas.width, this.previewViewportCanvas.height);
                    this.previewViewportCanvas.classList.add('hidden');
                }

                // Ukryj obraz mapy
                this.mapImage.src = '';
                this.mapImage.classList.add('hidden');

                // Wyczyść siatki
                this.gridSize = null;
                this.gridVisible = false;
                this.gridStatus.textContent = 'Siatka: brak';

                // Odśwież listę map i zresetuj select
                await this.loadMapsList();
                this.mapSelect.value = '';
            } else {
                const error = await response.text();
                alert(`Błąd podczas usuwania mapy: ${error}`);
            }
        } catch (error) {
            console.error('Error deleting map:', error);
            alert('Błąd podczas usuwania mapy');
        }
    }

    async loadMap(name){
        if(!name) return;
        try {
            const res = await fetch(`/api/maps/${name}`);
            const mapData = await res.json();
            this.currentMap = mapData;
            this.mapImage.src = `/api/map-files/${mapData.filename}`;
            this.mapImage.onload = () => {
                this.mapImage.classList.remove('hidden');
                this.fogCanvas.classList.remove('hidden');
                this.gridCanvas.classList.remove('hidden');
                this.calibrationCanvas.classList.remove('hidden');
                this.setupCanvases();
                this.loadFogState();
                this.loadGridConfig();
                this.resetZoom(); // Reset przed załadowaniem ustawień
                this.loadMapSettings(); // Wczytaj zapisane ustawienia mapy - nadpisze reset
                this.loadCharacters(); // Wczytaj postacie

                // Rozpocznij synchronizację mgły
                this.startFogSynchronization();
            };
        } catch(e){
            console.error('Błąd ładowania mapy:', e);
        }
    }

    // Nowa metoda do rozpoczęcia synchronizacji mgły
    startFogSynchronization() {
        // Zatrzymaj poprzedni polling jeśli istnieje
        this.stopFogSynchronization();

        // Rozpocznij nowy polling co 2 sekundy
        this.fogPollingInterval = setInterval(() => {
            this.syncFogState();
        }, 2000);
    }

    // Nowa metoda do zatrzymania synchronizacji mgły
    stopFogSynchronization() {
        if (this.fogPollingInterval) {
            clearInterval(this.fogPollingInterval);
            this.fogPollingInterval = null;
        }
    }

    // Nowa metoda do synchronizacji stanu mgły
    async syncFogState() {
        if (!this.currentMap) return;

        try {
            const response = await fetch(`/api/fog/${this.currentMap.name}`);
            if (!response.ok) return;

            const newFogState = await response.json();
            const newStateHash = this.calculateFogStateHash(newFogState);

            // Sprawdź czy stan mgły się zmienił
            if (this.lastFogStateHash !== newStateHash) {
                this.fogState = newFogState;
                this.lastFogStateHash = newStateHash;
                this.renderFog();
            }
        } catch (error) {
            // Cicha synchronizacja
        }
    }

    // Nowa metoda do obliczania hash'a stanu mgły
    calculateFogStateHash(fogState) {
        if (!fogState || !fogState.revealedAreas) return '';

        return fogState.revealedAreas
            .map(area => `${area.x},${area.y},${area.radius},${area.isGridCell || false}`)
            .sort()
            .join('|');
    }

    async loadFogState(){
        if(!this.currentMap) return;
        try {
            const res = await fetch(`/api/fog/${this.currentMap.name}`);
            if(res.ok) {
                this.fogState = await res.json();
                this.lastFogStateHash = this.calculateFogStateHash(this.fogState);

                // Zainicjalizuj sety odkrytych komórek na podstawie wczytanego stanu
                this.revealedCells.clear();
                this.paintedCells.clear();

                if(this.fogState && this.fogState.revealedAreas) {
                    this.fogState.revealedAreas.forEach(point => {
                        if(point.isGridCell && this.gridSize) {
                            // Oblicz pozycję komórki
                            const cellX = Math.round(point.x - this.gridSize / 2);
                            const cellY = Math.round(point.y - this.gridSize / 2);
                            const cellKey = `${cellX},${cellY}`;
                            this.revealedCells.add(cellKey);
                        }
                    });
                }

                this.renderFog();
            }
        } catch(e){
            console.error('Błąd ładowania stanu mgły:', e);
        }
    }

    setupCanvases(){
        [this.fogCanvas, this.gridCanvas, this.calibrationCanvas, this.charactersCanvas, this.previewViewportCanvas].forEach(c => {
            if (c) {
                c.width = this.currentMap.width;
                c.height = this.currentMap.height;
                c.style.width = this.currentMap.width + 'px';
                c.style.height = this.currentMap.height + 'px';
            }
        });
        // Narysuj początkową mgłę jako kwadrat bez zaokrągleń
        this.fogCtx.globalCompositeOperation = 'source-over';
        this.fogCtx.fillStyle = 'rgba(128,128,128,0.65)';
        this.fogCtx.fillRect(0, 0, this.currentMap.width, this.currentMap.height);
        this.calibrationCanvas.classList.remove('hidden');

        // Setup canvas postaci
        this.setupCharactersCanvas();
    }

    startGridCalibration(){
        this.isCalibrating = true;
        this.calibrationStart = null;
        this.calibrationCurrent = null;
        this.calibrationCanvas.classList.remove('hidden');
        this.mapContainer.classList.add('calibrating'); // Dodaj klasę dla kursora krzyżyka
        this.renderCalibrationOverlay();
    }

    handleCalibrationClick(e){
        const pos = this.getMousePos(e);
        if(!this.calibrationStart){
            this.calibrationStart = pos;
        } else {
            const dx = Math.abs(pos.x - this.calibrationStart.x);
            const dy = Math.abs(pos.y - this.calibrationStart.y);
            this.gridSize = Math.round(Math.max(dx, dy));
            this.gridOffsetX = Math.round(this.calibrationStart.x % this.gridSize);
            this.gridOffsetY = Math.round(this.calibrationStart.y % this.gridSize);
            this.isCalibrating = false;
            this.mapContainer.classList.remove('calibrating'); // Usuń klasę kursora krzyżyka
            this.calibrationStart = null;
            this.calibrationCurrent = null;
            this.gridVisible = true;

            // NAJPIERW wypełnij pola aby użytkownik od razu widział wartości
            this.gridSizeInput.value = this.gridSize.toFixed(1);
            this.gridOffsetXInput.value = this.gridOffsetX.toFixed(1);
            this.gridOffsetYInput.value = this.gridOffsetY.toFixed(1);
            this.gridLineWidthInput.value = this.gridLineWidth.toFixed(1);
            this.gridCountXInput.value = '';
            this.gridCountYInput.value = '';

            this.drawGrid();
            this.gridCanvas.classList.remove('hidden');
            this.gridStatus.textContent = `Siatka: ${this.gridSize.toFixed(1)}px (kalibracja zakończona, zapisywanie...)`;
            this.renderCalibrationOverlay();

            // POTEM zapisz na serwerze
            fetch(`/api/grid/${this.currentMap.name}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    gridSize: this.gridSize,
                    offsetX: this.gridOffsetX,
                    offsetY: this.gridOffsetY,
                    lineWidth: this.gridLineWidth
                })
            }).then(() => {
                this.gridStatus.textContent = `Siatka: ${this.gridSize.toFixed(1)}px (zapisana)`;
            }).catch((err) => {
                console.error('Błąd zapisu siatki:', err);
                alert('Błąd zapisu siatki');
            });
        }
    }

    calculateGridSizeFromCount() {
        if (!this.currentMap) {
            alert('Wybierz mapę najpierw');
            return;
        }

        const countX = parseInt(this.gridCountXInput.value);
        const countY = parseInt(this.gridCountYInput.value);

        if (countX > 0 && countY > 0) {
            // Wylicz rozmiar kratki dla obu wymiarów
            const sizeX = this.currentMap.width / countX;
            const sizeY = this.currentMap.height / countY;

            // Użyj MNIEJSZEJ wartości aby kratki były kwadratowe i zmieściły się w całym obrazie
            // To gwarantuje że siatka NIE wyjdzie poza obraz w żadnym wymiarze
            this.gridSize = Math.min(sizeX, sizeY);

            // Zaokrąglij do 2 miejsc po przecinku dla precyzji
            this.gridSize = Math.round(this.gridSize * 100) / 100;

            this.gridSizeInput.value = this.gridSize.toFixed(2);

            // Wycentruj siatkę - wylicz offset aby siatka była na środku
            const totalWidthUsed = this.gridSize * countX;
            const totalHeightUsed = this.gridSize * countY;

            this.gridOffsetX = Math.round((this.currentMap.width - totalWidthUsed) / 2 * 100) / 100;
            this.gridOffsetY = Math.round((this.currentMap.height - totalHeightUsed) / 2 * 100) / 100;

            this.gridOffsetXInput.value = this.gridOffsetX.toFixed(2);
            this.gridOffsetYInput.value = this.gridOffsetY.toFixed(2);

            // Ustaw siatkę jako widoczną
            this.gridVisible = true;
            this.gridCanvas.classList.remove('hidden');

            this.drawGrid();

            this.gridStatus.textContent = `Siatka: ${countX}x${countY} (${this.gridSize.toFixed(2)}px, kwadratowa, wycentrowana)`;
        }
    }

    renderCalibrationOverlay(){
        this.calibrationCtx.clearRect(0, 0, this.calibrationCanvas.width, this.calibrationCanvas.height);
        if(this.isCalibrating && this.calibrationStart){
            if(this.calibrationCurrent){
                const x1 = this.calibrationStart.x, y1 = this.calibrationStart.y,
                      x2 = this.calibrationCurrent.x, y2 = this.calibrationCurrent.y;
                const left = Math.min(x1, x2), top = Math.min(y1, y2),
                      w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
                this.calibrationCtx.strokeStyle = 'rgba(0,200,255,0.9)';
                this.calibrationCtx.lineWidth = 2;
                this.calibrationCtx.setLineDash([6, 4]);
                this.calibrationCtx.strokeRect(left, top, w, h);
                this.calibrationCtx.setLineDash([]);
                this.calibrationCtx.fillStyle = 'rgba(0,200,255,0.15)';
                this.calibrationCtx.fillRect(left, top, w, h);
            } else {
                this.calibrationCtx.fillStyle = 'rgba(0,200,255,0.9)';
                this.calibrationCtx.beginPath();
                this.calibrationCtx.arc(this.calibrationStart.x, this.calibrationStart.y, 6, 0, 2 * Math.PI);
                this.calibrationCtx.fill();
            }
        }
    }

    drawGrid(){
        this.gridCtx.clearRect(0, 0, this.currentMap.width, this.currentMap.height);
        if(!this.gridSize || !this.gridVisible) return;

        // Użyj kolorów i grubości linii z kontrolek
        const gridColorRgba = this.hexToRgba(this.gridColor, this.gridOpacity);
        this.gridCtx.strokeStyle = gridColorRgba;
        this.gridCtx.lineWidth = this.gridLineWidth;

        // Rysuj linie pionowe - zaczynaj DOKŁADNIE od offsetu
        // Dla kwadratowych siatek offset jest wyliczony aby wycentrować siatkę
        for(let x = this.gridOffsetX; x <= this.currentMap.width; x += this.gridSize){
            this.gridCtx.beginPath();
            this.gridCtx.moveTo(x, 0);
            this.gridCtx.lineTo(x, this.currentMap.height);
            this.gridCtx.stroke();
        }

        // Rysuj linie poziome - zaczynaj DOKŁADNIE od offsetu
        for(let y = this.gridOffsetY; y <= this.currentMap.height; y += this.gridSize){
            this.gridCtx.beginPath();
            this.gridCtx.moveTo(0, y);
            this.gridCtx.lineTo(this.currentMap.width, y);
            this.gridCtx.stroke();
        }

        // Podświetlenie kratek w zależności od trybu
        if(this.highlightCenterCell){
            const isOdd = this.gridAreaSizeValue % 2 === 1;
            const half = Math.floor(this.gridAreaSizeValue / 2);
            const startOffset = isOdd ? -half : -half;
            const endOffset = isOdd ? half : half - 1;
            let fillColor, strokeColor;

            // Wybierz kolor w zależności od trybu
            if(this.isPaintingFog) {
                fillColor = 'rgba(255,0,0,0.25)';      // Czerwony dla malowania mgły
                strokeColor = 'rgba(255,0,0,0.7)';
            } else if(this.isErasingFog) {
                fillColor = 'rgba(0,100,255,0.25)';    // Niebieski dla usuwania mgły
                strokeColor = 'rgba(0,100,255,0.7)';
            } else if(this.isAltPressed) {
                fillColor = 'rgba(0,255,0,0.25)';      // Zielony dla Alt (odsłanianie)
                strokeColor = 'rgba(0,255,0,0.7)';
            }

            if(fillColor && strokeColor) {
                for(let dx = startOffset; dx <= endOffset; dx++){
                    for(let dy = startOffset; dy <= endOffset; dy++){
                        const cellX = this.highlightCenterCell.x + dx * this.gridSize;
                        const cellY = this.highlightCenterCell.y + dy * this.gridSize;
                        if(cellX < 0 || cellY < 0 || cellX + this.gridSize > this.currentMap.width ||
                           cellY + this.gridSize > this.currentMap.height) continue;
                        this.gridCtx.fillStyle = fillColor;
                        this.gridCtx.fillRect(cellX, cellY, this.gridSize, this.gridSize);
                        this.gridCtx.strokeStyle = strokeColor;
                        this.gridCtx.strokeRect(cellX, cellY, this.gridSize, this.gridSize);
                    }
                }
            }
        }
    }

    getMousePos(e){
        if (!this.currentMap) return {x: 0, y: 0};

        // Pobierz pozycję kliknięcia względem kontenera
        const containerRect = this.mapContainer.getBoundingClientRect();
        let x = e.clientX - containerRect.left;
        let y = e.clientY - containerRect.top;

        // CSS Transform: translate(panOffset) scale(zoom) rotate(angle)
        // Transform-origin: (containerWidth/2, containerHeight/2) - w przestrzeni WRAPPER przed transformacją

        // Matematyka CSS transforms:
        // Finalna pozycja = translate + transformOrigin + rotate(scale(point - transformOrigin))
        // Odwracamy: point = inverse_rotate(inverse_scale(finalPos - translate - transformOrigin)) + transformOrigin

        const containerWidth = this.mapContainer.clientWidth;
        const containerHeight = this.mapContainer.clientHeight;
        const originX = containerWidth / 2;
        const originY = containerHeight / 2;

        // 1. Odejmij translate
        x -= this.panOffset.x;
        y -= this.panOffset.y;

        // 2. Przesuń do transform-origin
        x -= originX;
        y -= originY;

        // 3. Odwróć rotate
        if (this.rotation !== 0) {
            const angle = -this.rotation * Math.PI / 180;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const rotatedX = x * cos - y * sin;
            const rotatedY = x * sin + y * cos;
            x = rotatedX;
            y = rotatedY;
        }

        // 4. Odwróć scale
        x /= this.zoom;
        y /= this.zoom;

        // 5. Przesuń z powrotem od transform-origin
        x += originX;
        y += originY;

        return {x, y};
    }

    getGridCell(x, y){
        if(!this.gridSize) return null;

        // Dodaj margines tolerancji dla błędów zaokrągleń przy krawędziach (5px)
        const EDGE_TOLERANCE = 5;

        // Przytnij współrzędne do granic mapy z tolerancją
        const clampedX = Math.max(0, Math.min(x, this.currentMap.width - 0.01));
        const clampedY = Math.max(0, Math.min(y, this.currentMap.height - 0.01));

        // Sprawdź czy kliknięcie jest w granicach mapy (z tolerancją dla krawędzi)
        if(x < -EDGE_TOLERANCE || y < -EDGE_TOLERANCE ||
           x > this.currentMap.width + EDGE_TOLERANCE ||
           y > this.currentMap.height + EDGE_TOLERANCE) {
            return null;
        }

        // Uwzględnij offset przy wyliczaniu pozycji kratki (użyj przyciętych współrzędnych)
        const ax = clampedX - this.gridOffsetX;
        const ay = clampedY - this.gridOffsetY;

        // Jeśli kliknięcie jest przed offsetem ale w mapie, użyj pierwszej kratki
        const cellIndexX = ax < 0 ? 0 : Math.floor(ax / this.gridSize);
        const cellIndexY = ay < 0 ? 0 : Math.floor(ay / this.gridSize);

        // Wylicz pozycję kratki (lewy górny róg)
        const cellX = cellIndexX * this.gridSize + this.gridOffsetX;
        const cellY = cellIndexY * this.gridSize + this.gridOffsetY;


        return { x: cellX, y: cellY };
    }

    updateHighlight(e){
        if(!this.gridSize){
            this.clearHighlight();
            return;
        }

        // Sprawdź czy jesteśmy w trybie mgły lub Alt
        const shouldHighlight = this.isAltPressed || this.isPaintingFog || this.isErasingFog;
        if(!shouldHighlight){
            this.clearHighlight();
            return;
        }

        const pos = this.getMousePos(e);
        const cell = this.getGridCell(pos.x, pos.y);
        if(!cell){
            this.clearHighlight();
            return;
        }
        const changed = !this.highlightCenterCell || cell.x !== this.highlightCenterCell.x ||
                       cell.y !== this.highlightCenterCell.y;
        if(changed){
            this.highlightCenterCell = cell;
            this.drawGrid();
        }
    }

    clearHighlight(){
        if(this.highlightCenterCell){
            this.highlightCenterCell = null;
            this.drawGrid();
        }
    }

    revealGridArea(centerX, centerY){
        if(!this.gridSize) return;
        const isOdd = this.gridAreaSizeValue % 2 === 1;
        const half = Math.floor(this.gridAreaSizeValue / 2);
        const startOffset = isOdd ? -half : -half;
        const endOffset = isOdd ? half : half - 1;

        this.fogCtx.globalCompositeOperation = 'destination-out';
        this.fogCtx.fillStyle = 'rgba(0,0,0,1)';
        for(let dx = startOffset; dx <= endOffset; dx++){
            for(let dy = startOffset; dy <= endOffset; dy++){
                const cellX = centerX + dx * this.gridSize;
                const cellY = centerY + dy * this.gridSize;
                if(cellX < 0 || cellY < 0 || cellX + this.gridSize > this.currentMap.width ||
                   cellY + this.gridSize > this.currentMap.height) continue;
                this.fogCtx.fillRect(cellX, cellY, this.gridSize, this.gridSize);
                this.queueCell(cellX, cellY, 'erase'); // Usuwanie mgły
            }
        }
    }

    queueCell(x, y, action = 'erase'){
        // Utwórz unikalny klucz dla komórki
        const cellKey = `${Math.round(x)},${Math.round(y)}`;

        // Sprawdź czy komórka już jest w kolejce w tym samym stanie
        const alreadyQueued = this.pendingFogPoints.some(p => {
            const px = Math.round(p.x - this.gridSize / 2);
            const py = Math.round(p.y - this.gridSize / 2);
            return px === Math.round(x) && py === Math.round(y) && p.action === action;
        });

        if(alreadyQueued) {
            return; // Już w kolejce, nie dodawaj ponownie
        }

        // Dodaj do odpowiedniego setu dla śledzenia
        if(action === 'erase') {
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

        // Zwiększony buffer do 30 punktów dla lepszej wydajności
        if(this.pendingFogPoints.length >= 30) this.flushPending();
        else this.scheduleFlush();
    }

    scheduleFlush(){
        if(this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.flushPending(), 400);
    }

    async flushPending(){
        if(this.pendingFogPoints.length === 0) return;
        const pts = [...this.pendingFogPoints];
        this.pendingFogPoints = [];
        if(this.saveTimeout){
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }

        // Grupuj punkty według akcji
        const paintPoints = pts.filter(p => p.action === 'paint');
        const erasePoints = pts.filter(p => p.action === 'erase' || !p.action);

        try {
            // Malowanie mgły = usuwanie z odkrytych obszarów
            if(paintPoints.length > 0) {
                const res = await fetch(`/api/fog/${this.currentMap.name}/hide-batch`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(paintPoints)
                });

                if(!res.ok) {
                    throw new Error(`Błąd malowania mgły: ${res.status}`);
                }
            }

            // Usuwanie mgły = dodawanie do odkrytych obszarów
            if(erasePoints.length > 0) {
                const res = await fetch(`/api/fog/${this.currentMap.name}/reveal-batch`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(erasePoints)
                });

                if(!res.ok) {
                    throw new Error(`Błąd usuwania mgły: ${res.status}`);
                }
            }

            // NIE wywołuj syncFogState() - synchronizacja co 2 sekundy przez polling
        } catch(e){
            console.error('❌ Błąd zapisu mgły:', e);
            // Przywróć punkty do kolejki
            this.pendingFogPoints.push(...pts);
        }
    }

    async saveGridConfig(){
        if(!this.currentMap){
            alert('Wybierz mapę');
            return;
        }
        if(!this.gridSize || this.gridSize <= 0){
            alert('Niepoprawny rozmiar siatki (musi być > 0)');
            return;
        }
        try {
            const body = {
                gridSize: this.gridSize,
                offsetX: this.gridOffsetX || 0,
                offsetY: this.gridOffsetY || 0,
                lineWidth: this.gridLineWidth || 1.0
            };

            const r = await fetch(`/api/grid/${this.currentMap.name}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body)
            });

            if(!r.ok){
                const txt = await r.text();
                throw new Error(txt || 'Błąd zapisu');
            }


            // Przeładuj konfigurację z serwera aby mieć pewność że jest zsynchronizowana
            await this.loadGridConfig();

            alert('Siatka zapisana pomyślnie!');
        } catch(e){
            console.error('Błąd zapisu siatki:', e);
            alert('Błąd zapisu siatki: ' + e.message);
        }
    }

    async clearGridConfig(){
        if(!this.currentMap){
            return;
        }
        if(!confirm('Usuń zapis siatki?')) return;
        try {
            await fetch(`/api/grid/${this.currentMap.name}`, {method: 'DELETE'});
            this.gridSize = null;
            this.gridOffsetX = 0;
            this.gridOffsetY = 0;
            this.gridSizeInput.value = '';
            this.gridOffsetXInput.value = '0';
            this.gridOffsetYInput.value = '0';
            this.gridCanvas.classList.add('hidden');
            this.gridVisible = false;
            this.drawGrid();
            this.gridStatus.textContent = 'Siatka: usunięta';
        } catch(e){
            alert('Błąd usuwania siatki');
        }
    }

    async loadGridConfig(){
        try {
            const r = await fetch(`/api/grid/${this.currentMap.name}`);
            if(r.ok){
                const cfg = await r.json();
                this.gridSize = cfg.gridSize;
                this.gridOffsetX = cfg.offsetX || 0;
                this.gridOffsetY = cfg.offsetY || 0;
                this.gridLineWidth = cfg.lineWidth || 1.0;

                // Wypełnij pola z formatowaniem do 1 miejsca po przecinku
                this.gridSizeInput.value = this.gridSize.toFixed(1);
                this.gridOffsetXInput.value = this.gridOffsetX.toFixed(1);
                this.gridOffsetYInput.value = this.gridOffsetY.toFixed(1);
                this.gridLineWidthInput.value = this.gridLineWidth.toFixed(1);
                this.gridCountXInput.value = '';
                this.gridCountYInput.value = '';

                this.gridVisible = true;
                this.gridCanvas.classList.remove('hidden');
                this.gridStatus.textContent = `Siatka: ${this.gridSize.toFixed(1)}px (wczytana)`;
                this.drawGrid();
            } else {
                this.gridSize = null;
                this.gridVisible = false;
                this.gridCanvas.classList.add('hidden');
                this.gridStatus.textContent = 'Siatka: brak';
                this.gridSizeInput.value = '';
                this.gridOffsetXInput.value = '0';
                this.gridOffsetYInput.value = '0';
                this.gridLineWidthInput.value = '1';
                this.gridLineWidth = 1.0;
            }
        } catch(e){
            this.gridStatus.textContent = 'Siatka: błąd';
        }
    }

    async loadFogState(){
        // Załaduj stan mgły z serwera
        try {
            const r = await fetch(`/api/fog/${this.currentMap.name}`);
            if(r.ok){
                this.fogState = await r.json();
                this.lastFogStateHash = this.calculateFogStateHash(this.fogState);
                this.renderFog();
            }
        } catch(e){
            // Cicha synchronizacja
        }
    }



    zoomIn(){
        this.zoom = Math.min(this.zoom * 1.2, 5);
        this.applyTransform();
        this.saveMapSettings();
    }

    zoomOut(){
        this.zoom = Math.max(this.zoom / 1.2, 0.1);
        this.applyTransform();
        this.saveMapSettings();
    }

    resetZoom(){
        this.zoom = 1;
        this.panOffset = {x: 0, y: 0};
        this.applyTransform();
        this.saveMapSettings();
    }

    panDirection(dx, dy){
        this.panOffset.x += dx;
        this.panOffset.y += dy;
        this.applyTransform();
        this.saveMapSettings();
    }

    centerMap(){
        this.panOffset = {x: 0, y: 0};
        this.applyTransform();
        this.saveMapSettings();
    }

    applyTransform(){
        // Ustaw punkt obrotu na środek kontenera
        if (this.mapWrapper && this.mapContainer) {
            const containerWidth = this.mapContainer.clientWidth;
            const containerHeight = this.mapContainer.clientHeight;

            // Ustaw transform-origin na środek widocznego obszaru
            this.mapWrapper.style.transformOrigin = `${containerWidth / 2}px ${containerHeight / 2}px`;
        }

        // Zastosuj transformacje: translate, scale, rotate
        const transforms = [];
        transforms.push(`translate(${this.panOffset.x}px, ${this.panOffset.y}px)`);
        transforms.push(`scale(${this.zoom})`);
        if (this.rotation !== 0) {
            transforms.push(`rotate(${this.rotation}deg)`);
        }

        this.mapWrapper.style.transform = transforms.join(' ');
        this.zoomLevel.textContent = Math.round(this.zoom * 100) + '%';
    }

    handleWheel(e){
        e.preventDefault();
        e.deltaY < 0 ? this.zoomIn() : this.zoomOut();
    }

    onMouseDown(e){
        if(e.button !== 0) return;

        if(this.isCalibrating){
            this.handleCalibrationClick(e);
            return;
        }
        
        // SHIFT + klik = przesuwanie postaci (zawsze gdy jest siatka)
        if(this.isShiftPressed && this.gridSize) {
            this.handleCharacterClick(e);
            return;
        }

        // Obsługa modułu postaci (dodawanie/usuwanie)
        if(this.characterMode) {
            this.handleCharacterClick(e);
            return;
        }

        // Obsługa trybów malowania/usuwania mgły - TYLKO gdy przycisk jest aktywny
        if(this.isPaintingFog || this.isErasingFog) {
            this.lastPaintedCell = null; // Reset dla nowej sesji malowania
            const pos = this.getMousePos(e);
            if(this.isPaintingFog) {
                this.paintFogAtPosition(pos.x, pos.y);
            } else if(this.isErasingFog) {
                this.eraseFogAtPosition(pos.x, pos.y);
            }
            // Ustaw lastPaintedCell dla kratek
            if(this.gridSize) {
                const cell = this.getGridCell(pos.x, pos.y);
                if(cell) {
                    this.lastPaintedCell = `${cell.x},${cell.y}`;
                }
            }
            return;
        }

        // WYŁĄCZONE: malowanie z Alt - teraz tylko przesuwanie mapy
        if(this.isAltPressed && this.gridSize){
            // this.isDrawing = true;
            // this.revealUnderCursor(e);
            this.startPan(e);
        } else {
            this.startPan(e);
        }
    }

    onMouseMove(e){
        if(this.isCalibrating){
            if(this.calibrationStart){
                this.calibrationCurrent = this.getMousePos(e);
                this.renderCalibrationOverlay();
            }
            return;
        }
        
        // Obsługa przeciągania postaci
        if(this.draggingCharacter && this.gridSize) {
            // Wizualizacja gdzie postać zostanie upuszczona (opcjonalne)
            const pos = this.getMousePos(e);
            const cell = this.getGridCell(pos.x, pos.y);
            if(cell) {
                // Możesz tu dodać wizualizację (np. podświetlenie kratki)
                this.updateCursor();
            }
            return;
        }

        // Podświetlanie kratek w trybie mgły
        if((this.isPaintingFog || this.isErasingFog) && this.gridSize) {
            this.updateHighlight(e);
        }

        // Obsługa przeciągania dla malowania/usuwania mgły - TYLKO gdy przycisk jest aktywny
        if((this.isPaintingFog || this.isErasingFog) && e.buttons === 1) {
            const pos = this.getMousePos(e);
            if(this.gridSize) {
                // Sprawdź czy to nowa kratka (aby nie malować tej samej kratki wielokrotnie)
                const cell = this.getGridCell(pos.x, pos.y);
                if(cell) {
                    const key = `${cell.x},${cell.y}`;
                    if(key !== this.lastPaintedCell) {
                        if(this.isPaintingFog) {
                            this.paintFogGridArea(pos.x, pos.y);
                        } else if(this.isErasingFog) {
                            this.eraseFogGridArea(pos.x, pos.y);
                        }
                        this.lastPaintedCell = key;
                    }
                }
            } else {
                // Tryb wolny bez siatki
                if(this.isPaintingFog) {
                    this.paintFogAtPosition(pos.x, pos.y);
                } else if(this.isErasingFog) {
                    this.eraseFogAtPosition(pos.x, pos.y);
                }
            }
            return;
        }
        
        // Czyść podświetlenie gdy nie jesteśmy w trybie mgły
        if(!this.isPaintingFog && !this.isErasingFog) {
            this.clearHighlight();
        }

        if(this.isPanning) this.handlePan(e);
    }

    onMouseUp(e){
        // Obsługa drop postaci
        if(this.draggingCharacter) {
            this.handleCharacterDrop(e);
            return;
        }

        // WYŁĄCZONE: obsługa Alt dla odsłaniania
        // if(this.isDrawing){
        //     this.isDrawing = false;
        //     this.lastRevealedCell = null;
        //     this.flushPending();
        // }

        if(this.isPaintingFog || this.isErasingFog) {
            this.lastPaintedCell = null;
            this.flushPending(); // Zapisz zmiany mgły na serwer
        }
        if(this.isPanning) this.stopPan();
    }

    onMouseLeave(){
        // WYŁĄCZONE: obsługa Alt dla odsłaniania
        // if(this.isDrawing){
        //     this.isDrawing = false;
        //     this.lastRevealedCell = null;
        //     this.flushPending();
        // }

        if(this.isPaintingFog || this.isErasingFog) {
            this.lastPaintedCell = null;
            this.flushPending(); // Zapisz zmiany mgły na serwer
        }
        if(this.isPanning) this.stopPan();
        // this.clearHighlight(); // WYŁĄCZONE: highlight dla Alt
    }

    revealUnderCursor(e){
        const pos = this.getMousePos(e);
        const cell = this.getGridCell(pos.x, pos.y);
        if(!cell) return;
        const key = `${cell.x},${cell.y}`;
        if(key !== this.lastRevealedCell){
            this.revealGridArea(cell.x, cell.y);
            this.lastRevealedCell = key;
        }
    }

    startPan(e){
        this.isPanning = true;
        this.panStart.x = e.clientX - this.panOffset.x;
        this.panStart.y = e.clientY - this.panOffset.y;
        this.updateCursor();
    }

    handlePan(e){
        this.panOffset.x = e.clientX - this.panStart.x;
        this.panOffset.y = e.clientY - this.panStart.y;
        this.applyTransform();
    }

    stopPan(){
        this.isPanning = false;
        this.updateCursor();
    }

    updateCursor(){
        if(this.isCalibrating){
            this.mapContainer.style.cursor = 'crosshair';
            return;
        }
        if(this.isShiftPressed && this.gridSize){
            // Kursor przesuwania postaci
            this.mapContainer.style.cursor = this.draggingCharacter ? 'grabbing' : 'grab';
            return;
        }
        if(this.isAltPressed && this.gridSize){
            this.mapContainer.style.cursor = 'cell';
        } else if (this.isPaintingFog) {
            this.mapContainer.style.cursor = 'url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.2.7/assets/svg/paintbrush.svg), auto';
        } else if (this.isErasingFog) {
            this.mapContainer.style.cursor = 'url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.2.7/assets/svg/eraser.svg), auto';
        } else {
            this.mapContainer.style.cursor = this.isPanning ? 'grabbing' : 'grab';
        }
    }

    async resetFog(){
        if(!this.currentMap) return;
        if(!confirm('Czy na pewno chcesz zresetować całą mgłę?')) return;
        try {
            await fetch(`/api/fog/${this.currentMap.name}/reset`, {method: 'POST'});
            await this.loadFogState();
        } catch(e){
            console.error('Błąd resetowania mgły:', e);
        }
    }

    toggleGrid(){
        if(!this.gridSize){
            alert('Brak skalibrowanej siatki');
            return;
        }
        this.gridVisible = !this.gridVisible;
        this.gridCanvas.classList.toggle('hidden', !this.gridVisible);
        this.drawGrid();
        this.gridStatus.textContent = `Siatka: ${this.gridSize}px (${this.gridVisible ? 'widoczna' : 'ukryta'})`;
    }

    toggleFogMode(mode) {
        // Reset wszystkich trybów
        this.fogMode = this.fogMode === mode ? 'none' : mode;
        this.isPaintingFog = this.fogMode === 'paint';
        this.isErasingFog = this.fogMode === 'erase';
        
        // Usuń wszystkie klasy active najpierw
        this.paintFogBtn.classList.remove('active');
        this.eraseFogBtn.classList.remove('active');

        // Dodaj klasę active tylko do wybranego przycisku
        if (this.isPaintingFog) {
            this.paintFogBtn.classList.add('active');
        } else if (this.isErasingFog) {
            this.eraseFogBtn.classList.add('active');
        }

        // Aktualizuj kursor
        this.updateCursor();
    }

    paintFogAtPosition(x, y, radius = 20) {
        if (!this.gridSize) {
            // Tryb wolnego malowania gdy brak siatki
            // Najpierw wyczyść obszar aby uniknąć nakładania
            this.fogCtx.globalCompositeOperation = 'destination-out';
            this.fogCtx.beginPath();
            this.fogCtx.arc(x, y, radius, 0, 2 * Math.PI);
            this.fogCtx.fill();

            // Teraz namaluj nową mgłę z kolorami z kontrolek
            this.fogCtx.globalCompositeOperation = 'source-over';
            const fogColorRgba = this.hexToRgba(this.fogColor, this.fogOpacity);
            this.fogCtx.fillStyle = fogColorRgba;
            this.fogCtx.beginPath();
            this.fogCtx.arc(x, y, radius, 0, 2 * Math.PI);
            this.fogCtx.fill();
        } else {
            // Tryb kratek gdy jest siatka
            this.paintFogGridArea(x, y);
        }
        this.saveFogToServer('paint', x, y, radius);
    }

    eraseFogAtPosition(x, y, radius = 20) {
        if (!this.gridSize) {
            // Tryb wolnego usuwania gdy brak siatki
            this.fogCtx.globalCompositeOperation = 'destination-out';
            this.fogCtx.beginPath();
            this.fogCtx.arc(x, y, radius, 0, 2 * Math.PI);
            this.fogCtx.fill();
        } else {
            // Tryb kratek gdy jest siatka
            this.eraseFogGridArea(x, y);
        }
        this.saveFogToServer('erase', x, y, radius);
    }

    paintFogGridArea(x, y) {
        const cell = this.getGridCell(x, y);
        if (!cell) return;

        // Oblicz zakres kratek do pomalowania
        // Dla nieparzystych (1,3,5): centrum + symmetrycznie wokół
        // Dla parzystych (2,4): brak centrum, asymetrycznie
        const isOdd = this.gridAreaSizeValue % 2 === 1;
        const half = Math.floor(this.gridAreaSizeValue / 2);
        const startOffset = isOdd ? -half : -half;
        const endOffset = isOdd ? half : half - 1;

        // Najpierw wyczyść obszar (usuń istniejącą mgłę)
        this.fogCtx.globalCompositeOperation = 'destination-out';
        this.fogCtx.fillStyle = 'rgba(0,0,0,1)';

        for(let dx = startOffset; dx <= endOffset; dx++){
            for(let dy = startOffset; dy <= endOffset; dy++){
                const cellX = cell.x + dx * this.gridSize;
                const cellY = cell.y + dy * this.gridSize;
                if(cellX < 0 || cellY < 0 || cellX + this.gridSize > this.currentMap.width ||
                   cellY + this.gridSize > this.currentMap.height) continue;
                this.fogCtx.fillRect(cellX, cellY, this.gridSize, this.gridSize);
            }
        }

        // Teraz namaluj nową mgłę z kolorami z kontrolek
        this.fogCtx.globalCompositeOperation = 'source-over';
        const fogColorRgba = this.hexToRgba(this.fogColor, this.fogOpacity);
        this.fogCtx.fillStyle = fogColorRgba;

        for(let dx = startOffset; dx <= endOffset; dx++){
            for(let dy = startOffset; dy <= endOffset; dy++){
                const cellX = cell.x + dx * this.gridSize;
                const cellY = cell.y + dy * this.gridSize;
                if(cellX < 0 || cellY < 0 || cellX + this.gridSize > this.currentMap.width ||
                   cellY + this.gridSize > this.currentMap.height) continue;
                this.fogCtx.fillRect(cellX, cellY, this.gridSize, this.gridSize);

                // Dodaj punkt do kolejki do zapisania na serwerze - usuń z odkrytych obszarów
                this.queueCell(cellX, cellY, 'paint');
            }
        }
    }

    eraseFogGridArea(x, y) {
        const cell = this.getGridCell(x, y);
        if (!cell) return;

        // Oblicz zakres kratek do usunięcia
        const isOdd = this.gridAreaSizeValue % 2 === 1;
        const half = Math.floor(this.gridAreaSizeValue / 2);
        const startOffset = isOdd ? -half : -half;
        const endOffset = isOdd ? half : half - 1;

        this.fogCtx.globalCompositeOperation = 'destination-out';

        for(let dx = startOffset; dx <= endOffset; dx++){
            for(let dy = startOffset; dy <= endOffset; dy++){
                const cellX = cell.x + dx * this.gridSize;
                const cellY = cell.y + dy * this.gridSize;
                if(cellX < 0 || cellY < 0 || cellX + this.gridSize > this.currentMap.width ||
                   cellY + this.gridSize > this.currentMap.height) continue;
                this.fogCtx.fillRect(cellX, cellY, this.gridSize, this.gridSize);

                // Dodaj punkt do kolejki do zapisania na serwerze
                this.queueCell(cellX, cellY, 'erase');
            }
        }
    }

    async saveFogToServer(action, x, y, radius) {
        if (!this.currentMap) return;

        try {
            let endpoint, body;
            if (action === 'paint') {
                // Malowanie mgły = usuwanie z odkrytych obszarów
                endpoint = `hide-batch`;
                body = [{
                    x: x,
                    y: y,
                    radius: radius || 20,
                    isGridCell: !!this.gridSize
                }];
            } else {
                // Usuwanie mgły = dodawanie do odkrytych obszarów
                endpoint = `reveal-batch`;
                body = [{
                    x: x,
                    y: y,
                    radius: radius || 20,
                    isGridCell: !!this.gridSize
                }];
            }

            await fetch(`/api/fog/${this.currentMap.name}/${endpoint}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body)
            });
        } catch(e) {
            console.error('Błąd zapisu mgły na serwer:', e);
        }
    }

    queueFogCell(x, y, action) {
        this.pendingFogPoints.push({
            x: x,
            y: y,
            radius: this.gridSize / 2,
            action: action,
            isGridCell: true
        });
        if(this.pendingFogPoints.length >= 10) this.flushPending();
        else this.scheduleFlush();
    }


    showMap(){
        this.mapImage.classList.remove('hidden');
        this.fogCanvas.classList.remove('hidden');
        this.resetZoom();
    }


    // Metody obsługi kolorów mgły
    // Nowe funkcje dla kontrolek w sekcji widok
    updateFogColorFromView() {
        this.fogColor = this.fogColorPickerView.value;
        this.renderFog();
        this.saveMapSettings();
    }

    // Metody obsługi kolorów siatki
    updateGridColor() {
        this.gridColor = this.gridColorPicker.value;
        this.drawGrid();
        this.saveMapSettings();
    }

    // Metody obsługi viewport podglądu
    updatePreviewViewportColor() {
        this.previewViewportColor = this.previewViewportColorPicker.value;
        this.drawPreviewViewport();
        this.saveMapSettings();
    }

    togglePreviewViewport() {
        this.previewViewportVisible = !this.previewViewportVisible;
        if (this.previewViewportVisible) {
            this.drawPreviewViewport();
            if (this.togglePreviewViewportBtn) {
                this.togglePreviewViewportBtn.textContent = 'Ukryj podgląd';
            }
        } else {
            if (this.previewViewportCanvas) {
                this.previewViewportCtx.clearRect(0, 0, this.previewViewportCanvas.width, this.previewViewportCanvas.height);
            }
            if (this.togglePreviewViewportBtn) {
                this.togglePreviewViewportBtn.textContent = 'Pokaż podgląd';
            }
        }
        this.saveMapSettings();
    }

    // Metody obsługi obrotu mapy
    rotateMap(degrees) {
        this.rotation = (this.rotation + degrees + 360) % 360;
        this.updateRotationDisplay();
        this.applyTransform();
        this.drawCharacters(); // Przerysuj postacie z nową rotacją
        this.saveMapSettings();
        // Wyślij polecenie obrotu do podglądu
        this.sendRotationToPreview();
    }

    resetRotation() {
        this.rotation = 0;
        this.updateRotationDisplay();
        this.applyTransform();
        this.drawCharacters(); // Przerysuj postacie z nową rotacją
        this.saveMapSettings();
        // Wyślij polecenie obrotu do podglądu
        this.sendRotationToPreview();
    }

    updateRotationDisplay() {
        if (this.rotationValue) {
            this.rotationValue.textContent = `${this.rotation}°`;
        }
    }

    sendRotationToPreview() {
        const command = {
            action: 'rotate',
            rotation: this.rotation
        };
        fetch('/api/preview-map/navigation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command)
        }).catch(err => console.error('Error sending rotation command:', err));
    }

    // Funkcja do obracania tylko podglądu (bez obracania mapy na index)
    rotatePreview() {
        const command = {
            action: 'rotatePreview',
            degrees: 90
        };
        fetch('/api/preview-map/navigation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command)
        }).catch(err => console.error('Error sending rotation command:', err));
    }

    // ===== MODUŁ POSTACI =====

    toggleCharacterMode(mode) {
        // Wyłącz wszystkie tryby najpierw
        this.addPlayerBtn.classList.remove('active');
        this.addEnemyBtn.classList.remove('active');
        this.removeCharacterBtn.classList.remove('active');

        if (this.characterMode === mode) {
            // Wyłącz tryb (już usunięte klasy powyżej)
            this.characterMode = null;
        } else {
            // Włącz nowy tryb
            this.characterMode = mode;
            if (mode === 'player') {
                this.addPlayerBtn.classList.add('active');
            } else if (mode === 'enemy') {
                this.addEnemyBtn.classList.add('active');
            } else if (mode === 'remove') {
                this.removeCharacterBtn.classList.add('active');
            }
        }

        this.updateCursor();
    }

    handleCharacterClick(e) {
        if (!this.gridSize) {
            return;
        }

        const pos = this.getMousePos(e);
        const cell = this.getGridCell(pos.x, pos.y);
        if (!cell) {
            return;
        }

        // Shift+klik = podnieś postać (upuść w onMouseUp)
        if (this.isShiftPressed) {
            // Podnieś postać z tej kratki
            const charAtCell = this.findCharacterAtCell(cell.x, cell.y);
            if (charAtCell) {
                this.draggingCharacter = charAtCell;
                this.updateCursor();
            }
            return; // Ważne - nie przechodzimy dalej
        }

        // Normalne tryby (dodawanie/usuwanie) - tylko gdy NIE ma Shift
        if (!this.characterMode) return;

        // Tryb usuwania
        if (this.characterMode === 'remove') {
            this.removeCharacterAtCell(cell.x, cell.y);
            return;
        }

        // Sprawdź czy już jest postać w tej kratce
        const existingIndex = this.findCharacterAtCell(cell.x, cell.y);
        if (existingIndex) {
            return;
        }

        // Dodaj postać
        if (this.characterMode === 'player') {
            this.characters.players.push({ x: cell.x, y: cell.y });
        } else if (this.characterMode === 'enemy') {
            const letter = this.getNextEnemyLetter();
            this.characters.enemies.push({ x: cell.x, y: cell.y, letter });
        }

        this.drawCharacters();
        this.saveCharacters();
    }

    findCharacterAtCell(cellX, cellY) {
        const tolerance = this.gridSize ? this.gridSize / 2 : 10; // Tolerancja na zaokrąglenia

        // Sprawdź graczy
        const playerIndex = this.characters.players.findIndex(p => {
            return Math.abs(p.x - cellX) < tolerance && Math.abs(p.y - cellY) < tolerance;
        });
        if (playerIndex !== -1) {
            return { type: 'player', index: playerIndex };
        }

        // Sprawdź wrogów
        const enemyIndex = this.characters.enemies.findIndex(e => {
            return Math.abs(e.x - cellX) < tolerance && Math.abs(e.y - cellY) < tolerance;
        });
        if (enemyIndex !== -1) {
            return { type: 'enemy', index: enemyIndex };
        }

        return null;
    }

    moveCharacterToCell(character, newCellX, newCellY) {
        // Sprawdź czy docelowa kratka jest pusta (ignoruj tę samą postać!)
        const existingChar = this.findCharacterAtCell(newCellX, newCellY);
        if (existingChar && !(existingChar.type === character.type && existingChar.index === character.index)) {
            return;
        }

        // Przenieś postać
        if (character.type === 'player') {
            this.characters.players[character.index].x = newCellX;
            this.characters.players[character.index].y = newCellY;
        } else if (character.type === 'enemy') {
            this.characters.enemies[character.index].x = newCellX;
            this.characters.enemies[character.index].y = newCellY;
        }

        this.drawCharacters();
        this.saveCharacters();
    }

    getNextEnemyLetter() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const letter = alphabet[this.enemyLetterCounter % 26];
        this.enemyLetterCounter++;
        return letter;
    }

    removeCharacterAtCell(cellX, cellY) {
        // Usuń gracza jeśli istnieje
        const playerIndex = this.characters.players.findIndex(p => p.x === cellX && p.y === cellY);
        if (playerIndex !== -1) {
            this.characters.players.splice(playerIndex, 1);
            this.drawCharacters();
            this.saveCharacters();
            return;
        }

        // Usuń wroga jeśli istnieje
        const enemyIndex = this.characters.enemies.findIndex(e => e.x === cellX && e.y === cellY);
        if (enemyIndex !== -1) {
            this.characters.enemies.splice(enemyIndex, 1);
            this.drawCharacters();
            this.saveCharacters();
            return;
        }
    }

    handleCharacterDrag(e) {
        const pos = this.getMousePos(e);
        const cell = this.getGridCell(pos.x, pos.y);
        if (!cell) return;

        // Znajdź postać do przeciągnięcia
        if (!this.draggingCharacter) {
            // Szukaj postaci pod kursorem
            const playerIndex = this.characters.players.findIndex(p => p.x === cell.x && p.y === cell.y);
            if (playerIndex !== -1) {
                this.draggingCharacter = { type: 'player', index: playerIndex };
                return;
            }

            const enemyIndex = this.characters.enemies.findIndex(e => e.x === cell.x && e.y === cell.y);
            if (enemyIndex !== -1) {
                this.draggingCharacter = { type: 'enemy', index: enemyIndex };
                return;
            }
        }
    }

    handleCharacterDrop(e) {
        if (!this.draggingCharacter || !this.gridSize) {
            this.draggingCharacter = null;
            return;
        }

        const pos = this.getMousePos(e);
        const cell = this.getGridCell(pos.x, pos.y);
        if (!cell) {
            this.draggingCharacter = null;
            return;
        }


        // Przenieś postać używając moveCharacterToCell (ma już całą logikę)
        this.moveCharacterToCell(this.draggingCharacter, cell.x, cell.y);
        this.draggingCharacter = null;
        this.updateCursor();
    }

    removeLastCharacter(type) {
        if (type === 'player') {
            if (this.characters.players.length > 0) {
                this.characters.players.pop();
            }
        } else if (type === 'enemy') {
            if (this.characters.enemies.length > 0) {
                this.characters.enemies.pop();
                this.enemyLetterCounter--;
            }
        }
        this.drawCharacters();
        this.saveCharacters();
    }

    removeAllCharacters(type) {
        if (type === 'player') {
            this.characters.players = [];
        } else if (type === 'enemy') {
            this.characters.enemies = [];
            this.enemyLetterCounter = 0;
        }
        this.drawCharacters();
        this.saveCharacters();
    }

    drawCharacters() {
        if (!this.charactersCanvas || !this.currentMap || !this.gridSize) return;

        // Wyczyść canvas
        this.charactersCtx.clearRect(0, 0, this.charactersCanvas.width, this.charactersCanvas.height);

        // Rysuj graczy (okręgi) - bez rotacji, okręgi wyglądają tak samo
        this.charactersCtx.strokeStyle = this.playerColor;
        this.charactersCtx.fillStyle = this.playerColor + '40'; // 25% opacity
        this.charactersCtx.lineWidth = 3;

        this.characters.players.forEach(player => {
            const centerX = player.x + this.gridSize / 2;
            const centerY = player.y + this.gridSize / 2;
            const radius = this.gridSize / 2 - 5;

            this.charactersCtx.beginPath();
            this.charactersCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            this.charactersCtx.fill();
            this.charactersCtx.stroke();
        });

        // Rysuj wrogów (litery) - Z ROTACJĄ
        this.charactersCtx.fillStyle = this.enemyColor;
        this.charactersCtx.font = `bold ${this.gridSize * 0.6}px Arial`;
        this.charactersCtx.textAlign = 'center';
        this.charactersCtx.textBaseline = 'middle';

        this.characters.enemies.forEach(enemy => {
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
            this.charactersCtx.fillText(enemy.letter, 0, 0);

            this.charactersCtx.restore();
        });
    }

    saveCharacters() {
        if (!this.currentMap) return;

        const data = {
            characters: {
                players: this.characters.players,
                enemies: this.characters.enemies
            },
            enemyLetterCounter: this.enemyLetterCounter,
            playerColor: this.playerColor,
            enemyColor: this.enemyColor
        };

        // Zapisz lokalnie
        localStorage.setItem(`characters_${this.currentMap.name}`, JSON.stringify(data));

        // Wyślij na serwer dla synchronizacji z podglądem
        fetch(`/api/characters/${this.currentMap.name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).catch(err => console.error('Error saving characters to server:', err));
    }

    async loadCharacters() {
        if (!this.currentMap) return;

        // Najpierw spróbuj z localStorage
        const saved = localStorage.getItem(`characters_${this.currentMap.name}`);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.applyCharactersData(data);
                return;
            } catch (e) {
                console.error('Error loading characters from localStorage:', e);
            }
        }

        // Jeśli nie ma w localStorage, pobierz z serwera
        try {
            const res = await fetch(`/api/characters/${this.currentMap.name}`);
            if (res.ok) {
                const data = await res.json();
                this.applyCharactersData(data);
            }
        } catch (e) {
            console.error('Error loading characters from server:', e);
        }
    }

    applyCharactersData(data) {
        this.characters.players = data.characters?.players || data.players || [];
        this.characters.enemies = data.characters?.enemies || data.enemies || [];
        this.enemyLetterCounter = data.enemyLetterCounter || 0;

        if (data.playerColor) {
            this.playerColor = data.playerColor;
            if (this.playerColorPicker) this.playerColorPicker.value = data.playerColor;
        }

        if (data.enemyColor) {
            this.enemyColor = data.enemyColor;
            if (this.enemyColorPicker) this.enemyColorPicker.value = data.enemyColor;
        }

        this.drawCharacters();
    }

    setupCharactersCanvas() {
        if (!this.charactersCanvas || !this.currentMap) return;

        this.charactersCanvas.width = this.currentMap.width;
        this.charactersCanvas.height = this.currentMap.height;
        this.charactersCanvas.classList.remove('hidden');
    }

    // ===== KONIEC MODUŁU POSTACI =====

    // Metody zapisywania i wczytywania ustawień mapy
    async saveMapSettings() {
        if (!this.currentMap) return;

        const settings = {
            rotation: this.rotation,
            zoom: this.zoom,
            panOffset: this.panOffset,
            gridColor: this.gridColor,
            fogColor: this.fogColor,
            fogOpacity: this.fogOpacity,
            previewViewportColor: this.previewViewportColor,
            previewViewportVisible: this.previewViewportVisible,
            gridVisible: this.gridVisible
        };

        try {
            const response = await fetch(`/api/map-settings/${this.currentMap.name}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (!response.ok) {
                console.error('Błąd zapisu ustawień mapy');
            }
        } catch (error) {
            console.error('Błąd zapisu ustawień mapy:', error);
        }
    }

    async loadMapSettings() {
        if (!this.currentMap) return;

        try {
            const response = await fetch(`/api/map-settings/${this.currentMap.name}`);

            if (!response.ok) {
                return;
            }

            const settings = await response.json();

            // Przywróć ustawienia
            if (settings.rotation !== undefined) {
                this.rotation = settings.rotation;
                this.updateRotationDisplay();
            }

            if (settings.zoom !== undefined) {
                this.zoom = settings.zoom;
                if (this.zoomLevel) {
                    this.zoomLevel.textContent = `${Math.round(this.zoom * 100)}%`;
                }
            }

            if (settings.panOffset !== undefined) {
                this.panOffset = settings.panOffset;
            }

            if (settings.gridColor) {
                this.gridColor = settings.gridColor;
                if (this.gridColorPicker) {
                    this.gridColorPicker.value = settings.gridColor;
                }
            }

            if (settings.fogColor) {
                this.fogColor = settings.fogColor;
                if (this.fogColorPickerView) {
                    this.fogColorPickerView.value = settings.fogColor;
                }
            }

            if (settings.fogOpacity !== undefined) {
                this.fogOpacity = settings.fogOpacity;
                if (this.fogOpacitySlider) {
                    this.fogOpacitySlider.value = Math.round(settings.fogOpacity * 100);
                }
                if (this.fogOpacityValue) {
                    this.fogOpacityValue.textContent = `${Math.round(settings.fogOpacity * 100)}%`;
                }
            }

            if (settings.previewViewportColor) {
                this.previewViewportColor = settings.previewViewportColor;
                if (this.previewViewportColorPicker) {
                    this.previewViewportColorPicker.value = settings.previewViewportColor;
                }
            }

            if (settings.previewViewportVisible !== undefined) {
                this.previewViewportVisible = settings.previewViewportVisible;
                if (this.togglePreviewViewportBtn) {
                    this.togglePreviewViewportBtn.textContent = settings.previewViewportVisible ? 'Ukryj podgląd' : 'Pokaż podgląd';
                }
            }

            if (settings.gridVisible !== undefined) {
                this.gridVisible = settings.gridVisible;
            }

            // Zastosuj transformacje
            this.applyTransform();

        } catch (e) {
            console.error('Error loading map settings:', e);
        }
    }

    // Metoda do konwersji hex na rgba
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Funkcje do sterowania podglądem
    sendPreviewNavigation(action, direction) {
        const command = { action: action };
        if (direction) {
            command.direction = direction;
        }
        fetch('/api/preview-map/navigation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command)
        }).catch(err => console.error('Error sending navigation command:', err));
    }

    startViewportPolling() {
        if (this.viewportPollingInterval) {
            clearInterval(this.viewportPollingInterval);
        }
        this.viewportPollingInterval = setInterval(() => {
            this.fetchPreviewViewport();
        }, 200); // Poll co 200ms
    }

    async fetchPreviewViewport() {
        try {
            const res = await fetch('/api/preview-map/viewport');
            if (res.ok) {
                const viewport = await res.json();
                if (viewport && viewport.mapWidth) {
                    this.previewViewport = viewport;
                    this.drawPreviewViewport();
                }
            }
        } catch (err) {
            // Cicho ignoruj błędy - podgląd może nie być aktywny
        }
    }

    drawPreviewViewport() {
        if (!this.previewViewport || !this.previewViewportCanvas || !this.currentMap) {
            return;
        }

        // Sprawdź czy viewport jest dla aktualnej mapy
        if (this.previewViewport.mapWidth !== this.currentMap.width ||
            this.previewViewport.mapHeight !== this.currentMap.height) {
            return;
        }

        // Ustaw rozmiar canvas
        if (this.previewViewportCanvas.width !== this.currentMap.width ||
            this.previewViewportCanvas.height !== this.currentMap.height) {
            this.previewViewportCanvas.width = this.currentMap.width;
            this.previewViewportCanvas.height = this.currentMap.height;
        }

        // Wyczyść canvas
        this.previewViewportCtx.clearRect(0, 0, this.previewViewportCanvas.width, this.previewViewportCanvas.height);

        // Jeśli viewport jest ukryty, zakończ
        if (!this.previewViewportVisible) {
            return;
        }

        // Pokaż canvas jeśli jest ukryty
        if (this.previewViewportCanvas.classList.contains('hidden')) {
            this.previewViewportCanvas.classList.remove('hidden');
        }

        // Konwertuj hex na rgba
        const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        // Narysuj ramkę viewportu
        const vp = this.previewViewport;

        // Rysuj prostokąt - może wykraczać poza granice obrazu
        this.previewViewportCtx.strokeStyle = hexToRgba(this.previewViewportColor, 0.9);
        this.previewViewportCtx.lineWidth = 4;

        // Rysuj ramkę nawet jeśli wykracza poza canvas
        // Ustaw clipping aby nie rysować poza canvas
        this.previewViewportCtx.save();
        this.previewViewportCtx.beginPath();
        this.previewViewportCtx.rect(0, 0, this.currentMap.width, this.currentMap.height);
        this.previewViewportCtx.clip();

        this.previewViewportCtx.strokeRect(vp.x, vp.y, vp.width, vp.height);

        this.previewViewportCtx.restore();

        // Aktualizuj przycisk zoomLevel z wartością zoom z podglądu
        if (this.zoomLevel) {
            this.zoomLevel.textContent = `${Math.round(vp.zoom * 100)}%`;
        }
    }

    // Funkcja renderowania mgły
    renderFog() {
        if (!this.fogState || !this.currentMap) return;

        // Wyczyść canvas mgły
        this.fogCtx.clearRect(0, 0, this.currentMap.width, this.currentMap.height);

        // Najpierw narysuj podstawową warstwę mgły z odpowiednim kolorem
        this.fogCtx.globalCompositeOperation = 'source-over';
        const fogColorRgba = this.hexToRgba(this.fogColor, this.fogOpacity);
        this.fogCtx.fillStyle = fogColorRgba;
        this.fogCtx.fillRect(0, 0, this.currentMap.width, this.currentMap.height);

        // Teraz usuń odsłonięte obszary
        if (this.fogState.revealedAreas && this.fogState.revealedAreas.length > 0) {
            this.fogCtx.globalCompositeOperation = 'destination-out';
            this.fogCtx.fillStyle = 'rgba(255,255,255,1)';

            this.fogState.revealedAreas.forEach(area => {
                if (area.isGridCell && this.gridSize) {
                    // Dla kratek siatki - rysuj prostokąt
                    const cellX = area.x - area.radius;
                    const cellY = area.y - area.radius;
                    this.fogCtx.fillRect(cellX, cellY, area.radius * 2, area.radius * 2);
                } else {
                    // Dla normalnych obszarów - rysuj koło z gradientem
                    const gradient = this.fogCtx.createRadialGradient(
                        area.x, area.y, area.radius * 0.5,
                        area.x, area.y, area.radius
                    );
                    gradient.addColorStop(0, 'rgba(255,255,255,1)');
                    gradient.addColorStop(1, 'rgba(255,255,255,0)');

                    this.fogCtx.beginPath();
                    this.fogCtx.arc(area.x, area.y, area.radius, 0, 2 * Math.PI);
                    this.fogCtx.closePath();
                    this.fogCtx.fillStyle = gradient;
                    this.fogCtx.fill();
                }
            });
        }

        // Przywróć normalny tryb rysowania
        this.fogCtx.globalCompositeOperation = 'source-over';
    }
}

// Inicjalizacja aplikacji
document.addEventListener('DOMContentLoaded', () => {
    window.mapViewer = new DnDMapViewer();

    // Wczytaj listę map z serwera
    window.mapViewer.loadMapsList();
});

// Obsługa przycisku ustawiania podglądu
document.addEventListener('DOMContentLoaded', () => {
    const setPreviewBtn = document.getElementById('setPreviewMapBtn');
    if(setPreviewBtn) {
        setPreviewBtn.onclick = () => {
            const m = document.getElementById('mapSelect').value;
            if(!m) return;
            fetch('/api/preview-map', {
                method: 'POST',
                headers: {'Content-Type': 'text/plain'},
                body: m
            });
        };
    }
});
