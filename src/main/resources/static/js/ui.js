// ui.js - Obsługa interfejsu użytkownika
class UIManager {
    constructor(viewer) {
        this.viewer = viewer;
    }

    initElements() {
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

        // Canvas dla overlay viewport na głównej mapie
        this.viewportOverlayCanvas = document.getElementById('viewportOverlayCanvas');
        if (this.viewportOverlayCanvas) {
            this.viewportOverlayCtx = this.viewportOverlayCanvas.getContext('2d');
        }

        this.gridAreaSize = document.getElementById('gridAreaSize');
        this.resetFogBtn = document.getElementById('resetFogBtn');
        this.toggleGridBtn = document.getElementById('toggleGridBtn');
        this.gridStatus = document.getElementById('gridStatus');
        this.rotatePreviewBtn = document.getElementById('rotatePreviewBtn');
        this.rotatePreviewLeftBtn = document.getElementById('rotatePreviewLeftBtn');
        this.zoomLevel = document.getElementById('zoomLevel');
        this.navUpBtn = document.getElementById('navUpBtn');
        this.navDownBtn = document.getElementById('navDownBtn');
        this.navLeftBtn = document.getElementById('navLeftBtn');
        this.navRightBtn = document.getElementById('navRightBtn');
        this.navCenterBtn = document.getElementById('navCenterBtn');

        // Nowe precyzyjne kontrolki zoom
        this.zoomInput = document.getElementById('zoomInput');
        this.zoomDecrease1Btn = document.getElementById('zoomDecrease1Btn');
        this.zoomIncrease1Btn = document.getElementById('zoomIncrease1Btn');
        this.zoom50Btn = document.getElementById('zoom50Btn');
        this.zoom100Btn = document.getElementById('zoom100Btn');
        this.zoom150Btn = document.getElementById('zoom150Btn');
        this.zoom200Btn = document.getElementById('zoom200Btn');

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

        // Canvas dla overlay viewport na głównej mapie
        this.viewportOverlayCanvas = document.getElementById('viewportOverlayCanvas');
        if (this.viewportOverlayCanvas) {
            this.viewportOverlayCtx = this.viewportOverlayCanvas.getContext('2d');
        }

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
        this.moveCharacterBtn = document.getElementById('moveCharacterBtn');
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

        // Przypisz elementy do głównej klasy dla kompatybilności wstecznej
        Object.assign(this.viewer, this);
    }

    toggleSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('collapsed');
        }
    }

    showAddMapDialog() {
        const mapName = prompt('Nazwa nowej mapy:');
        if (!mapName || mapName.trim() === '') {
            alert('Nazwa mapy nie może być pusta!');
            return;
        }

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('name', mapName.trim());

                const response = await fetch('/api/maps/upload', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    await this.viewer.loadMapsList();
                    alert(`✅ Mapa "${mapName}" została dodana!`);
                } else {
                    const error = await response.text();
                    alert(`❌ Błąd podczas dodawania mapy: ${error}`);
                }
            } catch (error) {
                console.error('Error uploading map:', error);
                alert(`❌ Błąd podczas przesyłania mapy: ${error.message}`);
            }

            // Cleanup
            document.body.removeChild(fileInput);
        });

        document.body.appendChild(fileInput);
        fileInput.click();
    }

    async deleteCurrentMap() {
        if (!this.viewer.currentMap) {
            alert('❌ Nie wybrano mapy do usunięcia!');
            return;
        }

        const mapName = this.viewer.currentMap.name;
        const confirmation = confirm(`❓ Czy na pewno chcesz usunąć mapę "${mapName}"?\n\n⚠️ Ta operacja jest nieodwracalna!`);

        if (!confirmation) return;

        try {
            const response = await fetch(`/api/maps/${encodeURIComponent(mapName)}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Wyczyść aktualną mapę
                this.viewer.currentMap = null;
                this.viewer.mapImage.src = '';
                this.viewer.mapImage.style.display = 'none';

                // Wyczyść canvas'y
                if (this.viewer.fogCtx) {
                    this.viewer.fogCtx.clearRect(0, 0, this.viewer.fogCanvas.width, this.viewer.fogCanvas.height);
                }
                if (this.viewer.gridCtx) {
                    this.viewer.gridCtx.clearRect(0, 0, this.viewer.gridCanvas.width, this.viewer.gridCanvas.height);
                }
                if (this.viewer.charactersCtx) {
                    this.viewer.charactersCtx.clearRect(0, 0, this.viewer.charactersCanvas.width, this.viewer.charactersCanvas.height);
                }

                // Odśwież listę map
                await this.viewer.loadMapsList();
            } else {
                const error = await response.text();
                alert(`❌ Błąd podczas usuwania mapy: ${error}`);
            }
        } catch (error) {
            console.error('Error deleting map:', error);
            alert(`❌ Błąd podczas usuwania mapy: ${error.message}`);
        }
    }

    updateZoomDisplay() {
        if (this.zoomLevel) {
            this.zoomLevel.textContent = `${Math.round(this.viewer.zoom * 100)}%`;
        }
    }

    updateRotationDisplay() {
        if (this.rotationValue) {
            this.rotationValue.textContent = `${this.viewer.rotation}°`;
        }
    }

    updateGridStatus() {
        if (this.gridStatus && this.viewer.gridSize) {
            this.gridStatus.textContent = `Siatka: ${this.viewer.gridSize.toFixed(1)}px`;
        }
    }

    updateCursor() {
        if (this.viewer.isCalibrating) {
            this.mapContainer.style.cursor = 'crosshair';
            return;
        }
        if (this.viewer.isShiftPressed && this.viewer.gridSize) {
            this.mapContainer.style.cursor = 'grab';
            return;
        }
        if (this.viewer.characterMode) {
            this.mapContainer.style.cursor = 'crosshair';
            return;
        }
        if (this.viewer.isPaintingFog) {
            this.mapContainer.style.cursor = 'cell';
            return;
        }
        if (this.viewer.isErasingFog) {
            this.mapContainer.style.cursor = 'not-allowed';
            return;
        }
        if (this.viewer.isPanning) {
            this.mapContainer.style.cursor = 'grabbing';
            return;
        }
        if (this.viewer.isAltPressed && this.viewer.gridSize) {
            this.mapContainer.style.cursor = 'grab';
            return;
        }
        this.mapContainer.style.cursor = 'grab';
    }
}

// Debug - sprawdź czy klasa jest dostępna
window.UIManager = UIManager;

// Eksport dla innych modułów
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}
