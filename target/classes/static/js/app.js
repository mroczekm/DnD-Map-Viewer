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

        // Zmienne dla kolorów
        this.fogColor = '#808080';
        this.fogOpacity = 0.65;
        this.gridColor = '#ffffff';
        this.gridOpacity = 0.35;

        // Viewport podglądu
        this.previewViewport = null;
        this.previewViewportCanvas = null;
        this.previewViewportCtx = null;
        this.viewportPollingInterval = null;
        this.previewViewportColor = '#ff0000';
        this.previewViewportVisible = true;

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

        // Wyczyść stare dane mgły z localStorage (nie są już używane)
        this.clearOldFogDataFromLocalStorage();

        this.initElements();
        this.initEvents();
        this.startViewportPolling();
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
                console.log(`Removed old fog data: ${key}`);
            });
            if (keysToRemove.length > 0) {
                console.log(`Cleared ${keysToRemove.length} old fog data entries from localStorage`);
            }
        } catch (e) {
            console.error('Error clearing old fog data:', e);
        }
    }

    initElements(){
        this.mapSelect = document.getElementById('mapSelect');
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
        this.calibrateGridBtn = document.getElementById('calibrateGridBtn');
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
        this.gridSizeInput = document.getElementById('gridSizeInput');
        this.gridOffsetXInput = document.getElementById('gridOffsetXInput');
        this.gridOffsetYInput = document.getElementById('gridOffsetYInput');
        this.saveGridBtn = document.getElementById('saveGridBtn');
        this.clearGridBtn = document.getElementById('clearGridBtn');
        this.paintFogBtn = document.getElementById('paintFogBtn');
        this.eraseFogBtn = document.getElementById('eraseFogBtn');

        // Nowe elementy kontrolek kolorów
        this.gridColorPicker = document.getElementById('gridColorPicker');

        // Dodatkowe kontrolki koloru mgły w sekcji widok
        this.fogColorPickerView = document.getElementById('fogColorPickerView');

        // Canvas dla viewportu podglądu
        this.previewViewportCanvas = document.getElementById('previewViewportCanvas');
        if (this.previewViewportCanvas) {
            this.previewViewportCtx = this.previewViewportCanvas.getContext('2d');
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
            console.log('Initialized gridAreaSizeValue to:', this.gridAreaSizeValue);
        }
    }

    initEvents(){
        // Sprawdź czy elementy istnieją przed dodaniem event listenerów
        if(this.mapSelect) {
            this.mapSelect.addEventListener('change', e => {
                console.log('Map selected:', e.target.value);
                this.loadMap(e.target.value);
            });
        } else {
            console.error('mapSelect element not found');
        }

        if(this.gridAreaSize) {
            // Ponownie zsynchronizuj wartość na początku initEvents
            this.gridAreaSizeValue = parseInt(this.gridAreaSize.value) || 3;
            console.log('Re-synchronized gridAreaSizeValue to:', this.gridAreaSizeValue);
            console.log('Current select value:', this.gridAreaSize.value);
            console.log('Current select element:', this.gridAreaSize);

            this.gridAreaSize.addEventListener('change', e => {
                console.log('Grid area size changed from:', this.gridAreaSizeValue);
                console.log('Grid area size changed to:', e.target.value);
                console.log('Parse result:', parseInt(e.target.value));
                this.gridAreaSizeValue = parseInt(e.target.value);
                console.log('New gridAreaSizeValue:', this.gridAreaSizeValue);

                // Dodatkowe sprawdzenie
                if(this.gridAreaSizeValue !== parseInt(e.target.value)) {
                    console.error('Value assignment failed!');
                }
            });
        } else {
            console.error('gridAreaSize element not found');
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
        });
        document.addEventListener('keyup', e => {
            if(e.key === 'Alt'){
                this.isAltPressed = false;
                this.updateCursor();
                this.clearHighlight();
            }
        });
        this.mapContainer.addEventListener('mousedown', e => this.onMouseDown(e));
        this.mapContainer.addEventListener('mousemove', e => this.onMouseMove(e));
        this.mapContainer.addEventListener('mouseup', e => this.onMouseUp(e));
        this.mapContainer.addEventListener('mouseleave', () => this.onMouseLeave());
        ['dragstart', 'selectstart', 'contextmenu'].forEach(ev =>
            this.mapContainer.addEventListener(ev, evn => evn.preventDefault())
        );
        this.calibrateGridBtn.addEventListener('click', () => {
            if(!this.currentMap) return alert('Wybierz mapę!');
            this.startGridCalibration();
        });
        this.toggleGridBtn.addEventListener('click', () => this.toggleGrid());
        this.gridSizeInput.addEventListener('change', () => {
            const v = parseInt(this.gridSizeInput.value);
            if(v > 0){
                this.gridSize = v;
                this.drawGrid();
                this.gridStatus.textContent = `Siatka: ${this.gridSize}px (niezapisana)`;
            }
        });
        this.gridOffsetXInput.addEventListener('change', () => {
            this.gridOffsetX = parseInt(this.gridOffsetXInput.value) || 0;
            this.drawGrid();
            this.gridStatus.textContent = `Siatka: ${this.gridSize || '?'}px (niezapisana)`;
        });
        this.gridOffsetYInput.addEventListener('change', () => {
            this.gridOffsetY = parseInt(this.gridOffsetYInput.value) || 0;
            this.drawGrid();
            this.gridStatus.textContent = `Siatka: ${this.gridSize || '?'}px (niezapisana)`;
        });
        this.clearGridBtn.addEventListener('click', () => this.clearGridConfig());
        this.paintFogBtn.addEventListener('click', () => this.toggleFogMode('paint'));
        this.eraseFogBtn.addEventListener('click', () => this.toggleFogMode('erase'));

        // Event listenery dla kontrolek koloru mgły w sekcji widok
        if(this.fogColorPickerView) {
            this.fogColorPickerView.addEventListener('change', () => this.updateFogColorFromView());
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

        console.log('Rozpoczęto synchronizację mgły');
    }

    // Nowa metoda do zatrzymania synchronizacji mgły
    stopFogSynchronization() {
        if (this.fogPollingInterval) {
            clearInterval(this.fogPollingInterval);
            this.fogPollingInterval = null;
            console.log('Zatrzymano synchronizację mgły');
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
                console.log('Zaktualizowano stan mgły z serwera');
            }
        } catch (error) {
            console.error('Błąd synchronizacji mgły:', error);
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
            this.calibrationStart = null;
            this.calibrationCurrent = null;
            this.gridVisible = true;
            fetch(`/api/grid/${this.currentMap.name}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    gridSize: this.gridSize,
                    offsetX: this.gridOffsetX,
                    offsetY: this.gridOffsetY
                })
            }).then(() => {
                this.gridSizeInput.value = this.gridSize;
                this.gridOffsetXInput.value = this.gridOffsetX;
                this.gridOffsetYInput.value = this.gridOffsetY;
                this.drawGrid();
                this.gridCanvas.classList.remove('hidden');
                this.gridStatus.textContent = `Siatka: ${this.gridSize}px (skalibrowana)`;
                this.renderCalibrationOverlay();
            }).catch(() => alert('Błąd zapisu siatki'));
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

        // Użyj kolorów z kontrolek
        const gridColorRgba = this.hexToRgba(this.gridColor, this.gridOpacity);
        this.gridCtx.strokeStyle = gridColorRgba;
        this.gridCtx.lineWidth = 1;

        for(let x = this.gridOffsetX; x <= this.currentMap.width; x += this.gridSize){
            this.gridCtx.beginPath();
            this.gridCtx.moveTo(x, 0);
            this.gridCtx.lineTo(x, this.currentMap.height);
            this.gridCtx.stroke();
        }
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
        const rect = this.fogCanvas.getBoundingClientRect();
        const sx = this.fogCanvas.width / rect.width;
        const sy = this.fogCanvas.height / rect.height;
        return {x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy};
    }

    getGridCell(x, y){
        if(!this.gridSize) return null;
        const ax = x - this.gridOffsetX, ay = y - this.gridOffsetY;
        return {
            x: Math.floor(ax / this.gridSize) * this.gridSize + this.gridOffsetX,
            y: Math.floor(ay / this.gridSize) * this.gridSize + this.gridOffsetY
        };
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
                this.queueCell(cellX, cellY);
            }
        }
    }

    queueCell(x, y){
        this.pendingFogPoints.push({
            x: x + this.gridSize / 2,
            y: y + this.gridSize / 2,
            radius: this.gridSize / 2,
            isGridCell: true
        });
        if(this.pendingFogPoints.length >= 10) this.flushPending();
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
        const erasePoints = pts.filter(p => p.action === 'erase' || !p.action); // domyślnie erase dla kompatybilności

        try {
            // Malowanie mgły = usuwanie z odkrytych obszarów (przeciwieństwo reveal)
            if(paintPoints.length > 0) {
                await fetch(`/api/fog/${this.currentMap.name}/hide-batch`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(paintPoints)
                });
            }

            // Usuwanie mgły = dodawanie do odkrytych obszarów
            if(erasePoints.length > 0) {
                await fetch(`/api/fog/${this.currentMap.name}/reveal-batch`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(erasePoints)
                });
            }

            // Odśwież stan mgły po zapisie zmian
            await this.syncFogState();
        } catch(e){
            console.error('Błąd zapisu mgły', e);
            this.pendingFogPoints.push(...pts);
        }
    }

    async saveGridConfig(){
        if(!this.currentMap){
            alert('Wybierz mapę');
            return;
        }
        if(!this.gridSize || this.gridSize <= 0){
            alert('Niepoprawny rozmiar siatki');
            return;
        }
        try {
            const body = {
                gridSize: this.gridSize,
                offsetX: this.gridOffsetX,
                offsetY: this.gridOffsetY
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
            this.gridStatus.textContent = `Siatka: ${this.gridSize}px (zapisana)`;
            alert('Siatka zapisana');
            this.gridVisible = true;
            this.gridCanvas.classList.remove('hidden');
            this.drawGrid();
        } catch(e){
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
                this.gridOffsetX = Math.round(cfg.offsetX);
                this.gridOffsetY = Math.round(cfg.offsetY);
                this.gridSizeInput.value = this.gridSize;
                this.gridOffsetXInput.value = this.gridOffsetX;
                this.gridOffsetYInput.value = this.gridOffsetY;
                this.gridVisible = true;
                this.gridCanvas.classList.remove('hidden');
                this.gridStatus.textContent = `Siatka: ${this.gridSize}px (wczytana)`;
                this.drawGrid();
            } else {
                this.gridSize = null;
                this.gridVisible = false;
                this.gridCanvas.classList.add('hidden');
                this.gridStatus.textContent = 'Siatka: brak';
                this.gridSizeInput.value = '';
                this.gridOffsetXInput.value = '0';
                this.gridOffsetYInput.value = '0';
            }
        } catch(e){
            console.error(e);
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
                console.log('Załadowano stan mgły z serwera');
            }
        } catch(e){
            console.error(e);
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
        
        // Obsługa modułu postaci
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
        
        // Rozpocznij przeciąganie postaci z SHIFT
        if(e.shiftKey && this.gridSize) {
            this.handleCharacterDrag(e);
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
        
        // Aktualizuj wygląd przycisków używając klas Material Design
        this.paintFogBtn.classList.toggle('active', this.isPaintingFog);
        this.eraseFogBtn.classList.toggle('active', this.isErasingFog);

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
                this.queueFogCell(cellX + this.gridSize/2, cellY + this.gridSize/2, 'paint');
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
                this.queueFogCell(cellX + this.gridSize/2, cellY + this.gridSize/2, 'erase');
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
            console.log(`Fog ${action} sent to server:`, body);
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
        this.saveMapSettings();
        // Wyślij polecenie obrotu do podglądu
        this.sendRotationToPreview();
    }

    resetRotation() {
        this.rotation = 0;
        this.updateRotationDisplay();
        this.applyTransform();
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
        if (this.characterMode === mode) {
            // Wyłącz tryb
            this.characterMode = null;
            this.addPlayerBtn.classList.remove('active');
            this.addEnemyBtn.classList.remove('active');
            this.removeCharacterBtn.classList.remove('active');
            this.updateCursor();
        } else {
            // Włącz tryb
            this.characterMode = mode;
            this.addPlayerBtn.classList.toggle('active', mode === 'player');
            this.addEnemyBtn.classList.toggle('active', mode === 'enemy');
            this.removeCharacterBtn.classList.toggle('active', mode === 'remove');
            this.updateCursor();
        }
    }

    handleCharacterClick(e) {
        if (!this.characterMode || !this.gridSize) return;

        const pos = this.getMousePos(e);
        const cell = this.getGridCell(pos.x, pos.y);
        if (!cell) return;

        // Tryb usuwania
        if (this.characterMode === 'remove') {
            this.removeCharacterAtCell(cell.x, cell.y);
            return;
        }


        // Sprawdź czy już jest postać w tej kratce
        const existingIndex = this.findCharacterAtCell(cell.x, cell.y);
        if (existingIndex !== -1) {
            console.log('Na tym polu już jest postać');
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
        // Sprawdź graczy
        const playerIndex = this.characters.players.findIndex(p => p.x === cellX && p.y === cellY);
        if (playerIndex !== -1) return playerIndex;

        // Sprawdź wrogów
        const enemyIndex = this.characters.enemies.findIndex(e => e.x === cellX && e.y === cellY);
        if (enemyIndex !== -1) return enemyIndex;

        return -1;
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
        if (!this.draggingCharacter) return;

        const pos = this.getMousePos(e);
        const cell = this.getGridCell(pos.x, pos.y);
        if (!cell) {
            this.draggingCharacter = null;
            return;
        }

        // Sprawdź czy cel jest wolny
        const existingIndex = this.findCharacterAtCell(cell.x, cell.y);
        if (existingIndex !== -1 &&
            !(this.draggingCharacter.type === 'player' &&
              this.characters.players[this.draggingCharacter.index].x === cell.x &&
              this.characters.players[this.draggingCharacter.index].y === cell.y)) {
            console.log('Cel jest zajęty');
            this.draggingCharacter = null;
            return;
        }

        // Przenieś postać
        if (this.draggingCharacter.type === 'player') {
            this.characters.players[this.draggingCharacter.index].x = cell.x;
            this.characters.players[this.draggingCharacter.index].y = cell.y;
        } else {
            this.characters.enemies[this.draggingCharacter.index].x = cell.x;
            this.characters.enemies[this.draggingCharacter.index].y = cell.y;
        }

        this.draggingCharacter = null;
        this.drawCharacters();
        this.saveCharacters();
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

        // Rysuj graczy (okręgi)
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

        // Rysuj wrogów (litery)
        this.charactersCtx.fillStyle = this.enemyColor;
        this.charactersCtx.font = `bold ${this.gridSize * 0.6}px Arial`;
        this.charactersCtx.textAlign = 'center';
        this.charactersCtx.textBaseline = 'middle';

        this.characters.enemies.forEach(enemy => {
            const centerX = enemy.x + this.gridSize / 2;
            const centerY = enemy.y + this.gridSize / 2;

            this.charactersCtx.fillText(enemy.letter, centerX, centerY);
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
    saveMapSettings() {
        if (!this.currentMap) return;

        const settings = {
            rotation: this.rotation,
            zoom: this.zoom,
            panOffset: this.panOffset,
            gridColor: this.gridColor,
            fogColor: this.fogColor,
            previewViewportColor: this.previewViewportColor,
            previewViewportVisible: this.previewViewportVisible,
            gridVisible: this.gridVisible
        };

        localStorage.setItem(`map_settings_${this.currentMap.name}`, JSON.stringify(settings));
    }

    loadMapSettings() {
        if (!this.currentMap) return;

        const savedSettings = localStorage.getItem(`map_settings_${this.currentMap.name}`);
        if (!savedSettings) return;

        try {
            const settings = JSON.parse(savedSettings);

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

        // Narysuj ramkę viewportu uwzględniając obrót
        const vp = this.previewViewport;

        this.previewViewportCtx.save();

        // Jeśli jest obrót, zastosuj go do rysowania ramki
        if (vp.rotation && vp.rotation !== 0) {
            // Przesuń kontekst do środka viewportu
            const centerX = vp.x + vp.width / 2;
            const centerY = vp.y + vp.height / 2;
            this.previewViewportCtx.translate(centerX, centerY);
            this.previewViewportCtx.rotate((vp.rotation * Math.PI) / 180);
            this.previewViewportCtx.translate(-centerX, -centerY);
        }

        this.previewViewportCtx.strokeStyle = hexToRgba(this.previewViewportColor, 0.9);
        this.previewViewportCtx.lineWidth = 4;
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
