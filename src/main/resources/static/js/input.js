// input.js - Obsługa eventów myszy, klawiatury i dotyku
class InputManager {
    constructor(viewer) {
        this.viewer = viewer;
        this.touchStartPos = null;
        this.lastTouchTime = 0;
        this.touchMoveThreshold = 3; // Zmniejszony z 10 na 3 piksele dla lepszej responsywności
    }

    initEvents() {
        // Eventy klawiatury
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Alt') {
                this.viewer.isAltPressed = true;
                this.viewer.updateCursor();
                this.viewer.clearHighlight();
            }
            if (e.key === 'Shift') {
                this.viewer.isShiftPressed = true;
                this.viewer.updateCursor();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Alt') {
                this.viewer.isAltPressed = false;
                this.viewer.updateCursor();
                this.viewer.clearHighlight();
            }
            if (e.key === 'Shift') {
                this.viewer.isShiftPressed = false;
                this.viewer.draggingCharacter = null;
                this.viewer.updateCursor();
            }
        });

        // Eventy myszy
        this.viewer.mapContainer.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.viewer.mapContainer.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.viewer.mapContainer.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.viewer.mapContainer.addEventListener('mouseleave', () => this.onMouseLeave());

        // Eventy dotyku - NOWE
        this.viewer.mapContainer.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.viewer.mapContainer.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        this.viewer.mapContainer.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
        this.viewer.mapContainer.addEventListener('touchcancel', (e) => this.onTouchEnd(e), { passive: false });

        // Zapobieganie domyślnym zachowaniom
        ['dragstart', 'selectstart', 'contextmenu'].forEach(ev =>
            this.viewer.mapContainer.addEventListener(ev, evn => evn.preventDefault())
        );
    }

    // Metody obsługi myszy
    onMouseDown(e) {
        if (e.button !== 0) return;

        if (this.viewer.isCalibrating) {
            this.viewer.handleCalibrationClick(e);
            return;
        }

        // SHIFT + klik = przesuwanie postaci (zawsze gdy jest siatka)
        if (this.viewer.isShiftPressed && this.viewer.gridSize) {
            this.viewer.handleCharacterClick(e);
            return;
        }

        // Obsługa modułu postaci (dodawanie/usuwanie)
        if (this.viewer.characterMode) {
            this.viewer.handleCharacterClick(e);
            return;
        }

        // Obsługa trybów malowania/usuwania mgły - TYLKO gdy przycisk jest aktywny
        if (this.viewer.isPaintingFog || this.viewer.isErasingFog) {
            this.viewer.lastPaintedCell = null; // Reset dla nowej sesji malowania
            const pos = this.viewer.getMousePos(e);
            if (this.viewer.isPaintingFog) {
                this.viewer.paintFogAtPosition(pos.x, pos.y);
            } else if (this.viewer.isErasingFog) {
                this.viewer.eraseFogAtPosition(pos.x, pos.y);
            }
            // Ustaw lastPaintedCell dla kratek
            if (this.viewer.gridSize) {
                const cell = this.viewer.getGridCell(pos.x, pos.y);
                if (cell) {
                    this.viewer.lastPaintedCell = `${cell.x},${cell.y}`;
                }
            }
            return;
        }

        // WYŁĄCZONE: malowanie z Alt - teraz tylko przesuwanie mapy
        if (this.viewer.isAltPressed && this.viewer.gridSize) {
            this.startPan(e);
        } else {
            this.startPan(e);
        }
    }

    onMouseMove(e) {

        if (this.viewer.isCalibrating) {
            if (this.viewer.calibrationStart) {
                this.viewer.calibrationCurrent = this.viewer.getMousePos(e);
                this.viewer.renderCalibrationOverlay();
            }
            return;
        }

        // Obsługa przeciągania postaci
        if (this.viewer.draggingCharacter && this.viewer.gridSize) {
            const pos = this.viewer.getMousePos(e);
            const cell = this.viewer.getGridCell(pos.x, pos.y);
            if (cell) {
                this.viewer.updateCursor();
            }
            return;
        }

        // Podświetlanie kratek w trybie mgły
        if ((this.viewer.isPaintingFog || this.viewer.isErasingFog) && this.viewer.gridSize) {
            this.viewer.updateHighlight(e);
        }


        // Obsługa przeciągania dla malowania/usuwania mgły - TYLKO gdy przycisk jest aktywny
        if ((this.viewer.isPaintingFog || this.viewer.isErasingFog) && e.buttons === 1) {
            const pos = this.viewer.getMousePos(e);
            if (this.viewer.gridSize) {
                const cell = this.viewer.getGridCell(pos.x, pos.y);
                if (cell) {
                    const key = `${cell.x},${cell.y}`;
                    if (key !== this.viewer.lastPaintedCell) {
                        if (this.viewer.isPaintingFog) {
                            this.viewer.paintFogGridArea(pos.x, pos.y);
                        } else if (this.viewer.isErasingFog) {
                            this.viewer.eraseFogGridArea(pos.x, pos.y);
                        }
                        this.viewer.lastPaintedCell = key;
                    }
                }
            } else {
                if (this.viewer.isPaintingFog) {
                    this.viewer.paintFogAtPosition(pos.x, pos.y);
                } else if (this.viewer.isErasingFog) {
                    this.viewer.eraseFogAtPosition(pos.x, pos.y);
                }
            }
            return;
        }

        // Czyść podświetlenie gdy nie jesteśmy w trybie mgły
        if (!this.viewer.isPaintingFog && !this.viewer.isErasingFog) {
            this.viewer.clearHighlight();
        }

        if (this.viewer.isPanning) this.handlePan(e);
    }

    onMouseUp(e) {
        // Obsługa drop postaci
        if (this.viewer.draggingCharacter) {
            this.viewer.handleCharacterDrop(e);
            return;
        }

        if (this.viewer.isPaintingFog || this.viewer.isErasingFog) {
            this.viewer.lastPaintedCell = null;
            this.viewer.flushPending(); // Zapisz zmiany mgły na serwer

            // Wyczyść podświetlenie po zakończeniu malowania
            this.viewer.clearHighlight();
        }
        if (this.viewer.isPanning) this.stopPan();
    }

    onMouseLeave() {
        if (this.viewer.isPaintingFog || this.viewer.isErasingFog) {
            this.viewer.lastPaintedCell = null;
            this.viewer.flushPending(); // Zapisz zmiany mgły na serwer

            // Wyczyść podświetlenie gdy mysz opuszcza obszar mapy
            this.viewer.clearHighlight();
        }
        if (this.viewer.isPanning) this.stopPan();
    }

    // Nowe metody obsługi dotyku
    onTouchStart(e) {
        e.preventDefault();

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.touchStartPos = { x: touch.clientX, y: touch.clientY };
            this.lastTouchTime = Date.now();

            // SHIFT + dotyk = przesuwanie postaci (tak jak SHIFT + klik)
            if (this.viewer.isShiftPressed && this.viewer.gridSize) {
                const mockEvent = {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    target: e.target,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };
                this.viewer.handleCharacterClick(mockEvent);
                return;
            }

            // Obsługa trybu postaci (dodawanie/usuwanie) - jak zwykły klik
            if (this.viewer.characterMode) {
                const mockEvent = {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    target: e.target,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };
                this.viewer.handleCharacterClick(mockEvent);
                return;
            }

            // Jeśli jest aktywny tryb mgły, rozpocznij malowanie/usuwanie
            if (this.viewer.isPaintingFog || this.viewer.isErasingFog) {
                this.handleTouchFogAction(touch);
                return;
            }

            // W przeciwnym razie przygotuj się do przesuwania - pełny mockEvent
            const mockEvent = {
                button: 0,
                clientX: touch.clientX,
                clientY: touch.clientY,
                target: e.target,
                preventDefault: () => {},
                stopPropagation: () => {}
            };
            this.startPan(mockEvent);
        }
    }

    onTouchMove(e) {
        e.preventDefault();

        if (e.touches.length === 1 && this.touchStartPos) {
            const touch = e.touches[0];

            // Obsługa przeciągania postaci (tak jak w onMouseMove)
            if (this.viewer.draggingCharacter && this.viewer.gridSize) {
                const mockEvent = {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    target: e.target
                };
                const pos = this.viewer.getMousePos(mockEvent);
                const cell = this.viewer.getGridCell(pos.x, pos.y);
                if (cell) {
                    this.viewer.updateCursor();
                }
                return;
            }

            // DODANE: Podświetlanie dla dotyku w trybie mgły
            if ((this.viewer.isPaintingFog || this.viewer.isErasingFog) && this.viewer.gridSize) {
                const mockEvent = {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    target: e.target
                };
                this.viewer.updateHighlight(mockEvent);
            }

            // Jeśli jest aktywny tryb mgły, kontynuuj malowanie/usuwanie
            if (this.viewer.isPaintingFog || this.viewer.isErasingFog) {
                this.handleTouchFogAction(touch);
                return;
            }

            // Przesuwanie mapy - bez threshold dla płynności
            if (this.viewer.isPanning) {
                const mockEvent = {
                    button: 0,
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    target: e.target,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };
                this.handlePan(mockEvent);
            }
        }
    }

    onTouchEnd(e) {
        e.preventDefault();

        // Obsługa upuszczania postaci (drop) - jak w onMouseUp
        if (this.viewer.draggingCharacter) {
            const lastTouch = e.changedTouches && e.changedTouches[0];
            if (lastTouch) {
                const mockEvent = {
                    clientX: lastTouch.clientX,
                    clientY: lastTouch.clientY,
                    target: e.target,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };
                this.viewer.handleCharacterDrop(mockEvent);
            }
            return;
        }

        // Zakończ malowanie mgły jeśli było aktywne
        if (this.viewer.isPaintingFog || this.viewer.isErasingFog) {
            this.viewer.lastPaintedCell = null;
            this.viewer.flushPending();

            // NAPRAWIONE: Wyczyść podświetlenie po zakończeniu dotyku
            this.viewer.clearHighlight();
        }

        // Zakończ przesuwanie
        if (this.viewer.isPanning) {
            this.stopPan();
        }

        this.touchStartPos = null;
    }

    handleTouchFogAction(touch) {
        const rect = this.viewer.mapContainer.getBoundingClientRect();
        const mockEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY
        };

        const pos = this.viewer.getMousePos(mockEvent);

        if (this.viewer.isPaintingFog) {
            if (this.viewer.gridSize) {
                const cell = this.viewer.getGridCell(pos.x, pos.y);
                if (cell) {
                    const key = `${cell.x},${cell.y}`;
                    if (key !== this.viewer.lastPaintedCell) {
                        this.viewer.paintFogGridArea(pos.x, pos.y);
                        this.viewer.lastPaintedCell = key;
                    }
                }
            } else {
                this.viewer.paintFogAtPosition(pos.x, pos.y);
            }
        } else if (this.viewer.isErasingFog) {
            if (this.viewer.gridSize) {
                const cell = this.viewer.getGridCell(pos.x, pos.y);
                if (cell) {
                    const key = `${cell.x},${cell.y}`;
                    if (key !== this.viewer.lastPaintedCell) {
                        this.viewer.eraseFogGridArea(pos.x, pos.y);
                        this.viewer.lastPaintedCell = key;
                    }
                }
            } else {
                this.viewer.eraseFogAtPosition(pos.x, pos.y);
            }
        }
    }

    // Metody pomocnicze
    startPan(e) {
        this.viewer.isPanning = true;
        this.panStartClient = { x: e.clientX, y: e.clientY };
        this.panStartOffset = { x: this.viewer.panOffset.x, y: this.viewer.panOffset.y };
        this.viewer.updateCursor();
    }

    handlePan(e) {
        if (!this.viewer.isPanning) return;
        const dxScreen = e.clientX - this.panStartClient.x;
        const dyScreen = e.clientY - this.panStartClient.y;

        // ODWRÓCONA LOGIKA - TEST:
        // Jeśli obecna logika (-dxScreen, -dyScreen) nie działa, spróbujmy odwrotnie
        let dx = dxScreen;   // NOWA LOGIKA: ruch myszy w prawo = mapa w prawo
        let dy = dyScreen;   // NOWA LOGIKA: ruch myszy w dół = mapa w dół

        // 2. Przeskaluj przez zoom
        dx /= this.viewer.zoom;
        dy /= this.viewer.zoom;

        this.viewer.panOffset.x = this.panStartOffset.x + dx;
        this.viewer.panOffset.y = this.panStartOffset.y + dy;
        this.viewer.applyTransform();


        // Jeśli aktywne zdalne sterowanie – wyślij komendę
        if (this.viewer.remotePreviewControl) {
            fetch('/api/preview-map/viewport', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    x: 0,
                    panX: this.viewer.panOffset.x,
                    panY: this.viewer.panOffset.y,
                    zoom: this.viewer.zoom,
                    rotation: this.viewer.rotation
                })
            }).catch(()=>{});
        }
    }

    stopPan() {
        this.viewer.isPanning = false;
        this.viewer.updateCursor();
    }

    getTouchPos(touch) {
        // Użyj tej samej logiki co getMousePos dla spójności
        const mockEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY
        };
        return this.viewer.getMousePos(mockEvent);
    }
}

// Debug - sprawdź czy klasa jest dostępna
console.log('✅ InputManager class loaded');
window.InputManager = InputManager;

// Eksport dla innych modułów
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputManager;
}
