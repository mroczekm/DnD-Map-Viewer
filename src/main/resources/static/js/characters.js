// characters.js - Obsługa postaci
class CharactersManager {
    constructor(viewer) {
        this.viewer = viewer;
    }

    toggleCharacterMode(mode) {
        // Wyłącz wszystkie tryby najpierw
        if (this.viewer.addPlayerBtn) this.viewer.addPlayerBtn.classList.remove('active');
        if (this.viewer.addEnemyBtn) this.viewer.addEnemyBtn.classList.remove('active');
        if (this.viewer.removeCharacterBtn) this.viewer.removeCharacterBtn.classList.remove('active');

        if (this.viewer.characterMode === mode) {
            // Wyłącz tryb
            this.viewer.characterMode = null;
        } else {
            // Włącz nowy tryb
            this.viewer.characterMode = mode;
            if (mode === 'player' && this.viewer.addPlayerBtn) {
                this.viewer.addPlayerBtn.classList.add('active');
            } else if (mode === 'enemy' && this.viewer.addEnemyBtn) {
                this.viewer.addEnemyBtn.classList.add('active');
            } else if (mode === 'remove' && this.viewer.removeCharacterBtn) {
                this.viewer.removeCharacterBtn.classList.add('active');
            }
        }

        this.viewer.updateCursor();
    }

    handleCharacterClick(e) {
        if (!this.viewer.gridSize) {
            return;
        }

        const pos = this.viewer.getMousePos(e);
        const cell = this.viewer.getGridCell(pos.x, pos.y);
        if (!cell) {
            return;
        }

        // Shift+klik = podnieś postać (upuść w onMouseUp)
        if (this.viewer.isShiftPressed) {
            // Podnieś postać z tej kratki
            const charAtCell = this.findCharacterAtCell(cell.x, cell.y);
            if (charAtCell) {
                this.viewer.draggingCharacter = charAtCell;
                this.viewer.updateCursor();
            }
            return; // Ważne - nie przechodzimy dalej
        }

        // Normalne tryby (dodawanie/usuwanie) - tylko gdy NIE ma Shift
        if (!this.viewer.characterMode) {
            return;
        }

        // Tryb usuwania
        if (this.viewer.characterMode === 'remove') {
            this.removeCharacterAtCell(cell.x, cell.y);
            return;
        }

        // Sprawdź czy już jest postać w tej kratce
        const existingIndex = this.findCharacterAtCell(cell.x, cell.y);
        if (existingIndex) {
            return;
        }

        // Dodaj postać
        if (this.viewer.characterMode === 'player') {
            this.viewer.characters.players.push({ x: cell.x, y: cell.y });
        } else if (this.viewer.characterMode === 'enemy') {
            const letter = this.getNextEnemyLetter();
            this.viewer.characters.enemies.push({ x: cell.x, y: cell.y, letter });
        }

        this.drawCharacters();
        this.saveCharacters();
    }

    findCharacterAtCell(cellX, cellY) {
        const tolerance = this.viewer.gridSize ? this.viewer.gridSize / 4 : 5; // Mniejsza tolerancja dla lepszej precyzji

        // Sprawdź graczy
        const playerIndex = this.viewer.characters.players.findIndex(p => {
            return Math.abs(p.x - cellX) < tolerance && Math.abs(p.y - cellY) < tolerance;
        });
        if (playerIndex !== -1) {
            return { type: 'player', index: playerIndex };
        }

        // Sprawdź wrogów
        const enemyIndex = this.viewer.characters.enemies.findIndex(e => {
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
            this.viewer.characters.players[character.index].x = newCellX;
            this.viewer.characters.players[character.index].y = newCellY;
        } else if (character.type === 'enemy') {
            this.viewer.characters.enemies[character.index].x = newCellX;
            this.viewer.characters.enemies[character.index].y = newCellY;
        }

        this.drawCharacters();
        this.saveCharacters();
    }

    getNextEnemyLetter() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const letter = alphabet[this.viewer.enemyLetterCounter % 26];
        this.viewer.enemyLetterCounter++;
        return letter;
    }

    removeCharacterAtCell(cellX, cellY) {
        const tolerance = this.viewer.gridSize ? this.viewer.gridSize / 4 : 5; // Ta sama tolerancja co w findCharacterAtCell

        // Usuń gracza jeśli istnieje
        const playerIndex = this.viewer.characters.players.findIndex(p => {
            return Math.abs(p.x - cellX) < tolerance && Math.abs(p.y - cellY) < tolerance;
        });
        if (playerIndex !== -1) {
            this.viewer.characters.players.splice(playerIndex, 1);
            this.drawCharacters();
            this.saveCharacters();
            return;
        }

        // Usuń wroga jeśli istnieje
        const enemyIndex = this.viewer.characters.enemies.findIndex(e => {
            return Math.abs(e.x - cellX) < tolerance && Math.abs(e.y - cellY) < tolerance;
        });
        if (enemyIndex !== -1) {
            this.viewer.characters.enemies.splice(enemyIndex, 1);
            this.drawCharacters();
            this.saveCharacters();
            return;
        }
    }

    handleCharacterDrag(e) {
        const pos = this.viewer.getMousePos(e);
        const cell = this.viewer.getGridCell(pos.x, pos.y);
        if (!cell) return;

        // Znajdź postać do przeciągnięcia
        if (!this.viewer.draggingCharacter) {
            // Szukaj postaci pod kursorem
            const playerIndex = this.viewer.characters.players.findIndex(p => p.x === cell.x && p.y === cell.y);
            if (playerIndex !== -1) {
                this.viewer.draggingCharacter = { type: 'player', index: playerIndex };
                return;
            }

            const enemyIndex = this.viewer.characters.enemies.findIndex(e => e.x === cell.x && e.y === cell.y);
            if (enemyIndex !== -1) {
                this.viewer.draggingCharacter = { type: 'enemy', index: enemyIndex };
                return;
            }
        }
    }

    handleCharacterDrop(e) {
        if (!this.viewer.draggingCharacter || !this.viewer.gridSize) {
            this.viewer.draggingCharacter = null;
            return;
        }

        const pos = this.viewer.getMousePos(e);
        const cell = this.viewer.getGridCell(pos.x, pos.y);
        if (!cell) {
            this.viewer.draggingCharacter = null;
            return;
        }

        // Przenieś postać używając moveCharacterToCell (ma już całą logikę)
        this.moveCharacterToCell(this.viewer.draggingCharacter, cell.x, cell.y);
        this.viewer.draggingCharacter = null;
        this.viewer.updateCursor();
    }

    removeLastCharacter(type) {
        if (type === 'player') {
            if (this.viewer.characters.players.length > 0) {
                this.viewer.characters.players.pop();
            }
        } else if (type === 'enemy') {
            if (this.viewer.characters.enemies.length > 0) {
                this.viewer.characters.enemies.pop();
                this.viewer.enemyLetterCounter--;
            }
        }
        this.drawCharacters();
        this.saveCharacters();
    }

    removeAllCharacters(type) {
        if (type === 'player') {
            this.viewer.characters.players = [];
        } else if (type === 'enemy') {
            this.viewer.characters.enemies = [];
            this.viewer.enemyLetterCounter = 0;
        }
        this.drawCharacters();
        this.saveCharacters();
    }

    drawCharacters() {
        if (!this.viewer.charactersCanvas || !this.viewer.currentMap || !this.viewer.gridSize) {
            return;
        }


        // Wyczyść canvas
        this.viewer.charactersCtx.clearRect(0, 0, this.viewer.charactersCanvas.width, this.viewer.charactersCanvas.height);

        // Rysuj graczy (okręgi) - bez rotacji, okręgi wyglądają tak samo
        this.viewer.charactersCtx.strokeStyle = this.viewer.playerColor;
        this.viewer.charactersCtx.fillStyle = this.viewer.playerColor + '40'; // 25% opacity
        this.viewer.charactersCtx.lineWidth = 3;

        this.viewer.characters.players.forEach(player => {
            const centerX = player.x + this.viewer.gridSize / 2;
            const centerY = player.y + this.viewer.gridSize / 2;
            const radius = this.viewer.gridSize / 2 - 5;

            this.viewer.charactersCtx.beginPath();
            this.viewer.charactersCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            this.viewer.charactersCtx.fill();
            this.viewer.charactersCtx.stroke();
        });

        // Rysuj wrogów (litery) - Z ROTACJĄ
        this.viewer.charactersCtx.fillStyle = this.viewer.enemyColor;
        this.viewer.charactersCtx.font = `bold ${this.viewer.gridSize * 0.6}px Arial`;
        this.viewer.charactersCtx.textAlign = 'center';
        this.viewer.charactersCtx.textBaseline = 'middle';

        this.viewer.characters.enemies.forEach(enemy => {
            const centerX = enemy.x + this.viewer.gridSize / 2;
            const centerY = enemy.y + this.viewer.gridSize / 2;

            this.viewer.charactersCtx.save();

            // Przesuń do środka litery
            this.viewer.charactersCtx.translate(centerX, centerY);

            // Obróć literę w PRZECIWNYM kierunku niż mapa, aby była zawsze czytelna
            // Jeśli mapa obrócona o 90°, literka o -90° = czytelna
            if (this.viewer.rotation !== 0) {
                this.viewer.charactersCtx.rotate((-this.viewer.rotation * Math.PI) / 180);
            }

            // Narysuj literę w środku (0, 0)
            this.viewer.charactersCtx.fillText(enemy.letter, 0, 0);

            this.viewer.charactersCtx.restore();
        });
    }

    saveCharacters() {
        if (!this.viewer.currentMap) return;

        const data = {
            characters: {
                players: this.viewer.characters.players,
                enemies: this.viewer.characters.enemies
            },
            enemyLetterCounter: this.viewer.enemyLetterCounter,
            playerColor: this.viewer.playerColor,
            enemyColor: this.viewer.enemyColor
        };

        // Zapisz lokalnie
        localStorage.setItem(`characters_${this.viewer.currentMap.name}`, JSON.stringify(data));

        // Wyślij na serwer dla synchronizacji z podglądem
        fetch(`/api/characters/${this.viewer.currentMap.name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).catch(err => console.error('Error saving characters to server:', err));

        // Użyj zunifikowanego systemu zapisywania
        // Użyj saveMapSettings - bezpieczne dla mgły
        if (this.viewer.saveMapSettings) {
            this.viewer.saveMapSettings().catch(err =>
                console.error('Error saving character settings:', err)
            );
        }

        // Jeśli aktywny podgląd, wyślij postacie natychmiast
        if (this.viewer.remotePreviewControl && this.viewer.sendCharactersToPreview) {
            this.viewer.sendCharactersToPreview(this.viewer.currentMap.name);
        }
    }

    async loadCharacters() {
        if (!this.viewer.currentMap) {
            return;
        }

        // Najpierw spróbuj z localStorage
        const saved = localStorage.getItem(`characters_${this.viewer.currentMap.name}`);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.applyCharactersData(data);
                return;
            } catch (e) {
                console.error('Error loading characters from localStorage:', e);
            }
        }

        // Jeśli nie ma w localStorage, spróbuj z serwera
        try {
            const response = await fetch(`/api/characters/${encodeURIComponent(this.viewer.currentMap.name)}`);
            if (response.ok) {
                const data = await response.json();
                this.applyCharactersData(data);
            } else {
                // Brak danych - użyj domyślnych wartości
                this.resetCharacters();
            }
        } catch (error) {
            console.error('❌ Characters load error:', error);
            this.resetCharacters();
        }
    }

    applyCharactersData(data) {
        this.viewer.characters = data.characters || { players: [], enemies: [] };
        this.viewer.enemyLetterCounter = data.enemyLetterCounter || 0;
        this.viewer.playerColor = data.playerColor || '#00ff00';
        this.viewer.enemyColor = data.enemyColor || '#ff0000';

        // Aktualizuj kontrolki kolorów
        if (this.viewer.playerColorPicker) {
            this.viewer.playerColorPicker.value = this.viewer.playerColor;
        }
        if (this.viewer.enemyColorPicker) {
            this.viewer.enemyColorPicker.value = this.viewer.enemyColor;
        }

        this.drawCharacters();
    }

    resetCharacters() {
        this.viewer.characters = { players: [], enemies: [] };
        this.viewer.enemyLetterCounter = 0;
        this.viewer.playerColor = '#00ff00';
        this.viewer.enemyColor = '#ff0000';

        // Aktualizuj kontrolki kolorów
        if (this.viewer.playerColorPicker) {
            this.viewer.playerColorPicker.value = this.viewer.playerColor;
        }
        if (this.viewer.enemyColorPicker) {
            this.viewer.enemyColorPicker.value = this.viewer.enemyColor;
        }

        this.drawCharacters();
    }

    setupCharactersCanvas() {
        if (!this.viewer.charactersCanvas || !this.viewer.currentMap) {
            return;
        }


        this.viewer.charactersCanvas.width = this.viewer.currentMap.width;
        this.viewer.charactersCanvas.height = this.viewer.currentMap.height;
        this.viewer.charactersCanvas.style.width = this.viewer.currentMap.width + 'px';
        this.viewer.charactersCanvas.style.height = this.viewer.currentMap.height + 'px';

        this.drawCharacters();
    }
}

// Debug - sprawdź czy klasa jest dostępna
console.log('✅ CharactersManager class loaded');
window.CharactersManager = CharactersManager;

// Eksport dla innych modułów
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharactersManager;
}
