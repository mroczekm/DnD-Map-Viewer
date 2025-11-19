// preview.js - Shared preview functionality for both GM and player views

class PreviewManager {
    constructor() {
        this.mapImage = null;
        this.fogLayer = null;
        this.charactersLayer = null;
        this.mapContainer = null;
        this.mapWrapper = null;
        this.fogCtx = null;
        this.charactersCtx = null;

        this.fogState = null;
        this.mapInfo = null;
        this.previewMapName = null;
        this.animationFrame = null;
        this.animationTime = 0;

        // Grid variables
        this.gridSize = null;
        this.gridOffsetX = 0;
        this.gridOffsetY = 0;

        // Fog variables
        this.fogColor = '#808080';
        this.fogOpacity = 0.65;

        // Characters variables
        this.characters = { players: [], enemies: [] };
        this.playerColor = '#00ff00';
        this.enemyColor = '#ff0000';

        // Viewport and zoom
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.rotation = 0;
    }

    // Initialize elements (to be called by specific implementations)
    initElements(elementIds) {
        this.mapImage = document.getElementById(elementIds.mapImage || 'mapImage');
        this.fogLayer = document.getElementById(elementIds.fogLayer || 'fogLayer');
        this.charactersLayer = document.getElementById(elementIds.charactersLayer || 'charactersLayer');
        this.mapContainer = document.getElementById(elementIds.mapContainer || 'mapContainer');
        this.mapWrapper = document.getElementById(elementIds.mapWrapper || 'mapWrapper');

        if (this.fogLayer) {
            this.fogCtx = this.fogLayer.getContext('2d');
        }
        if (this.charactersLayer) {
            this.charactersCtx = this.charactersLayer.getContext('2d');
        }
    }

    // Validate canvas dimensions before drawing
    validateCanvasDimensions(canvas, width, height) {
        if (!canvas || !width || !height || width <= 0 || height <= 0) {
            console.warn('Invalid canvas dimensions:', { canvas: !!canvas, width, height });
            return false;
        }
        return true;
    }

    // Safe canvas resize
    resizeCanvas(canvas, width, height) {
        if (!this.validateCanvasDimensions(canvas, width, height)) {
            return false;
        }

        try {
            canvas.width = width;
            canvas.height = height;
            return true;
        } catch (error) {
            console.error('Error resizing canvas:', error);
            return false;
        }
    }

    // Update transform with proper validation
    updateTransform() {
        if (!this.mapImage || !this.mapImage.complete || !this.mapContainer || !this.mapWrapper) {
            return;
        }

        const containerWidth = this.mapContainer.clientWidth;
        const containerHeight = this.mapContainer.clientHeight;
        const imageWidth = this.mapImage.naturalWidth;
        const imageHeight = this.mapImage.naturalHeight;

        if (!containerWidth || !containerHeight || !imageWidth || !imageHeight) {
            console.warn('Invalid dimensions for transform update');
            return;
        }

        // Position wrapper to center image
        const wrapperLeft = (containerWidth - imageWidth) / 2;
        const wrapperTop = (containerHeight - imageHeight) / 2;

        this.mapWrapper.style.left = wrapperLeft + 'px';
        this.mapWrapper.style.top = wrapperTop + 'px';

        // Set transform origin at container center relative to wrapper
        const originX = containerWidth / 2 - wrapperLeft;
        const originY = containerHeight / 2 - wrapperTop;
        this.mapWrapper.style.transformOrigin = `${originX}px ${originY}px`;

        // Apply transforms
        const transforms = [];
        transforms.push(`translate(${this.panX}px, ${this.panY}px)`);
        transforms.push(`scale(${this.zoom})`);
        if (this.rotation !== 0) {
            transforms.push(`rotate(${this.rotation}deg)`);
        }

        this.mapWrapper.style.transform = transforms.join(' ');

        // Redraw characters when transform changes
        this.drawCharacters();
    }

    // Enhanced noise for more realistic fog
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

        const k0 = a;
        const k1 = b - a;
        const k2 = c - a;
        const k3 = a - b - c + d;

        return (k0 + k1 * u + k2 * v + k3 * u * v + 1) * 0.5;
    }

    // Draw animated fog background
    drawFogBackground(ctx, width, height, time = 0) {
        if (!this.validateCanvasDimensions(ctx.canvas, width, height)) {
            return;
        }

        try {
            const imageData = ctx.createImageData(width, height);
            const step = 3;
            const windTime = time * 0.002;

            for (let y = 0; y < height; y += step) {
                for (let x = 0; x < width; x += step) {
                    const scale1 = 0.003;
                    const scale2 = 0.006;
                    const scale3 = 0.012;

                    const drift1X = Math.sin(windTime * 0.3) * 20;
                    const drift1Y = Math.cos(windTime * 0.2) * 15;
                    const drift2X = Math.sin(windTime * 0.5 + 100) * 30;
                    const drift2Y = Math.cos(windTime * 0.4 + 100) * 25;

                    const layer1 = this.perlinNoise((x + drift1X) * scale1, (y + drift1Y) * scale1, windTime * 10);
                    const layer2 = this.perlinNoise((x + drift2X) * scale2, (y + drift2Y) * scale2, windTime * 15 + 1000);
                    const layer3 = this.perlinNoise(x * scale3, y * scale3, windTime * 20 + 2000);

                    const cloudDensity = layer1 * 0.5 + layer2 * 0.3 + layer3 * 0.2;
                    const grayValue = Math.floor(50 + cloudDensity * 90);
                    const clampedGray = Math.max(40, Math.min(140, grayValue));

                    for (let dy = 0; dy < step && y + dy < height; dy++) {
                        for (let dx = 0; dx < step && x + dx < width; dx++) {
                            const idx = ((y + dy) * width + (x + dx)) * 4;
                            imageData.data[idx] = clampedGray;
                            imageData.data[idx + 1] = clampedGray;
                            imageData.data[idx + 2] = clampedGray;
                            imageData.data[idx + 3] = 255;
                        }
                    }
                }
            }

            ctx.putImageData(imageData, 0, 0);
        } catch (error) {
            console.error('Error drawing fog background:', error);
        }
    }

    // Render fog with proper validation
    renderFog() {
        if (!this.fogState || !this.mapImage || !this.mapImage.complete || !this.fogLayer || !this.fogCtx) {
            return;
        }

        const imageWidth = this.mapImage.naturalWidth;
        const imageHeight = this.mapImage.naturalHeight;

        // Validate and resize fog canvas
        if (!this.resizeCanvas(this.fogLayer, imageWidth, imageHeight)) {
            console.warn('Failed to resize fog canvas');
            return;
        }

        this.fogLayer.style.width = this.mapImage.width + 'px';
        this.fogLayer.style.height = this.mapImage.height + 'px';

        try {
            this.fogCtx.clearRect(0, 0, this.fogLayer.width, this.fogLayer.height);
            this.drawFogBackground(this.fogCtx, this.fogLayer.width, this.fogLayer.height, this.animationTime);

            if (this.fogState && this.fogState.revealedAreas) {
                this.fogCtx.save();
                this.fogCtx.globalCompositeOperation = 'destination-out';

                this.fogState.revealedAreas.forEach(area => {
                    const looksLikeGridCell = this.gridSize && Math.abs(area.radius - this.gridSize / 2) < 0.01;
                    if (area.isGridCell || looksLikeGridCell) {
                        this.fogCtx.fillStyle = 'rgba(255,255,255,1)';
                        const cellX = area.x - area.radius;
                        const cellY = area.y - area.radius;
                        this.fogCtx.fillRect(cellX, cellY, area.radius * 2, area.radius * 2);
                    } else {
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

                this.fogCtx.restore();
            }
        } catch (error) {
            console.error('Error rendering fog:', error);
        }
    }

    // Draw characters with rotation compensation
    drawCharacters() {
        if (!this.mapImage || !this.mapImage.complete || !this.gridSize || !this.charactersLayer || !this.charactersCtx) {
            return;
        }

        const imageWidth = this.mapImage.naturalWidth;
        const imageHeight = this.mapImage.naturalHeight;

        // Validate and resize characters canvas
        if (!this.resizeCanvas(this.charactersLayer, imageWidth, imageHeight)) {
            console.warn('Failed to resize characters canvas');
            return;
        }

        try {
            this.charactersCtx.clearRect(0, 0, this.charactersLayer.width, this.charactersLayer.height);

            // Draw players (circles)
            this.charactersCtx.strokeStyle = this.playerColor;
            this.charactersCtx.fillStyle = this.playerColor + '40';
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

            // Draw enemies (letters with rotation compensation)
            this.charactersCtx.fillStyle = this.enemyColor;
            this.charactersCtx.font = `bold ${this.gridSize * 0.6}px Arial`;
            this.charactersCtx.textAlign = 'center';
            this.charactersCtx.textBaseline = 'middle';

            this.characters.enemies.forEach(enemy => {
                const centerX = enemy.x + this.gridSize / 2;
                const centerY = enemy.y + this.gridSize / 2;

                this.charactersCtx.save();
                this.charactersCtx.translate(centerX, centerY);

                // Rotate letter opposite to map rotation for readability
                if (this.rotation !== 0) {
                    this.charactersCtx.rotate((-this.rotation * Math.PI) / 180);
                }

                this.charactersCtx.fillText(enemy.letter, 0, 0);
                this.charactersCtx.restore();
            });
        } catch (error) {
            console.error('Error drawing characters:', error);
        }
    }

    // Fetch functions
    async fetchPreviewMapName() {
        try {
            const response = await fetch('/api/preview-map');
            if (response.ok) {
                this.previewMapName = await response.text();
                return this.previewMapName;
            }
        } catch (error) {
            console.error('Error fetching preview map name:', error);
        }
        return null;
    }

    async fetchMapInfo() {
        if (!this.previewMapName) return;

        try {
            const response = await fetch(`/api/maps/${this.previewMapName}`);
            if (response.ok) {
                this.mapInfo = await response.json();
                this.mapImage.src = `/api/map-files/${this.mapInfo.filename}`;

                return new Promise((resolve) => {
                    this.mapImage.onload = () => {
                        this.panX = 0;
                        this.panY = 0;
                        this.zoom = 1;
                        this.rotation = 0;
                        this.updateTransform();
                        this.renderFog();
                        resolve();
                    };
                });
            }
        } catch (error) {
            console.error('Error fetching map info:', error);
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
            console.error('Error fetching fog state:', error);
        }
    }

    async fetchGridConfig() {
        if (!this.previewMapName) return;

        try {
            const response = await fetch(`/api/grid/${this.previewMapName}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.gridSize) {
                    this.gridSize = data.gridSize;
                    this.gridOffsetX = Math.round(data.offsetX || 0);
                    this.gridOffsetY = Math.round(data.offsetY || 0);
                    await this.fetchCharacters();
                }
            }
        } catch (error) {
            console.error('Error fetching grid config:', error);
            this.gridSize = null;
        }
    }

    async fetchCharacters() {
        if (!this.previewMapName) return;

        try {
            const response = await fetch(`/api/characters/${this.previewMapName}`);
            if (response.ok) {
                const data = await response.json();
                if (data) {
                    this.characters = data.characters || { players: [], enemies: [] };
                    this.playerColor = data.playerColor || '#00ff00';
                    this.enemyColor = data.enemyColor || '#ff0000';
                    this.drawCharacters();
                }
            }
        } catch (error) {
            console.error('Error fetching characters:', error);
        }
    }

    // Animation functions
    animateFog() {
        this.animationTime += 32;
        this.renderFog();
        this.animationFrame = requestAnimationFrame(() => this.animateFog());
    }

    startFogAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.animateFog();
    }

    stopFogAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    // Polling functions
    startPollingFog(interval = 2000) {
        setInterval(() => {
            this.fetchFogState();
        }, interval);
    }

    startPollingCharacters(interval = 2000) {
        setInterval(() => {
            this.fetchCharacters();
        }, interval);
    }

    startPollingRefreshRequest(interval = 2000) {
        setInterval(() => {
            fetch('/api/preview-map/refresh')
                .then(res => res.json())
                .then(refresh => {
                    if (refresh) {
                        // USUNIĘTO window.location.reload() - nie przeładowuj strony!
                        console.log('⚠️ Preview.js: refresh request ignored (używaj podglad.js)');
                    }
                })
                .catch(err => console.error('Error polling refresh:', err));
        }, interval);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PreviewManager;
} else {
    window.PreviewManager = PreviewManager;
}
