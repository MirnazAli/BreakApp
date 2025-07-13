// src/renderer/animations/kittens.js
class KittenAnimation {
    constructor(container) {
        this.container = container;
        this.kittens = [];
        this.isRunning = false;
        this.spawnInterval = null;
        this.cursorElement = null;
        
        // Cursor tracking
        this.cursorX = window.innerWidth / 2;
        this.cursorY = window.innerHeight / 2;
        this.lastCursorX = this.cursorX;
        this.lastCursorY = this.cursorY;
        
        // Animation timing
        this.baseSpawnRate = 2000; // Base spawn rate in milliseconds
        this.currentSpawnRate = this.baseSpawnRate;
        this.minSpawnRate = 50; // Minimum time between spawns
        this.maxSpawnRate = 3000; // Maximum time between spawns
        
        // Movement tracking
        this.movementSpeed = 0;
        this.movementHistory = [];
        this.maxMovementHistory = 10;
        
        // Rate acceleration
        this.rateAcceleration = 0.98; // Multiply rate by this each spawn (makes it faster)
        this.movementMultiplier = 2; // How much movement affects spawn rate
        
        // Animation start time for gradual increase
        this.startTime = null;
        
        this.setupMouseTracking();
        this.createCustomCursor();
    }
    
    setupMouseTracking() {
        document.addEventListener('mousemove', (e) => {
            this.lastCursorX = this.cursorX;
            this.lastCursorY = this.cursorY;
            this.cursorX = e.clientX;
            this.cursorY = e.clientY;
            
            // Calculate movement speed
            const deltaX = this.cursorX - this.lastCursorX;
            const deltaY = this.cursorY - this.lastCursorY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Add to movement history
            this.movementHistory.push(distance);
            if (this.movementHistory.length > this.maxMovementHistory) {
                this.movementHistory.shift();
            }
            
            // Calculate average movement speed
            this.movementSpeed = this.movementHistory.reduce((sum, speed) => sum + speed, 0) / this.movementHistory.length;
            
            // Spawn extra kittens based on movement
            if (this.isRunning && this.movementSpeed > 5) {
                const extraSpawns = Math.floor(this.movementSpeed / 10);
                for (let i = 0; i < extraSpawns; i++) {
                    this.spawnSingle();
                }
            }

            // Update custom cursor position
            if (this.cursorElement) {
                this.cursorElement.style.left = `${e.clientX}px`;
                this.cursorElement.style.top = `${e.clientY}px`;
            }
        });
    }
    
    createKitten() {
        const kitten = document.createElement('div');
        kitten.className = 'kitten';
        
        // Position with slight random offset
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = (Math.random() - 0.5) * 40;
        const startX = this.cursorX + offsetX;
        const startY = this.cursorY + offsetY;
        
        kitten.style.left = `${startX}px`;
        kitten.style.top = `${startY}px`;
        
        // Random movement direction and distance
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 200 + 100; // 100-300 pixels
        const endX = startX + Math.cos(angle) * distance;
        const endY = startY + Math.sin(angle) * distance;
        
        // Random animation duration
        const duration = Math.random() * 2 + 1.5; // 1.5-3.5 seconds
        
        // Random kitten colors
        const colors = ['#ff9800', '#ff5722', '#795548', '#9e9e9e', '#607d8b', '#4caf50', '#2196f3', '#9c27b0'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Create SVG kitten with random expressions
        const expressions = [
            'M45 55 Q50 60 55 55', // smile
            'M45 55 Q50 50 55 55', // frown
            'M48 55 L52 55', // neutral
            'M45 55 Q50 65 55 55' // big smile
        ];
        const expression = expressions[Math.floor(Math.random() * expressions.length)];
        
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="25" fill="${color}"/>
                <circle cx="40" cy="45" r="3" fill="#333"/>
                <circle cx="60" cy="45" r="3" fill="#333"/>
                <path d="M35 30 L40 20 L45 30 Z" fill="${color}"/>
                <path d="M55 30 L60 20 L65 30 Z" fill="${color}"/>
                <path d="${expression}" stroke="#333" stroke-width="2" fill="none"/>
                <circle cx="50" cy="52" r="1" fill="#ff69b4"/>
                <circle cx="35" cy="40" r="2" fill="#ffeb3b" opacity="0.7"/>
                <circle cx="65" cy="40" r="2" fill="#ffeb3b" opacity="0.7"/>
            </svg>
        `;
        
        kitten.innerHTML = svg;
        
        // Create custom animation
        const keyframes = [
            {
                transform: `translate(0, 0) scale(0.1) rotate(0deg)`,
                opacity: 0
            },
            {
                transform: `translate(0, 0) scale(1) rotate(${Math.random() * 360}deg)`,
                opacity: 1,
                offset: 0.2
            },
            {
                transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0.5) rotate(${Math.random() * 720}deg)`,
                opacity: 0
            }
        ];
        
        const animation = kitten.animate(keyframes, {
            duration: duration * 1000,
            easing: 'ease-out'
        });
        
        // Add floating effect
        const floatKeyframes = [
            { transform: 'translateY(0px)' },
            { transform: 'translateY(-10px)' },
            { transform: 'translateY(0px)' }
        ];
        
        kitten.animate(floatKeyframes, {
            duration: 2000,
            iterations: Infinity,
            easing: 'ease-in-out'
        });
        
        // Remove animation that makes kittens disappear
        // Replace with static positioning
        kitten.style.left = `${startX}px`;
        kitten.style.top = `${startY}px`;
        
        // Add hover effects
        kitten.style.transition = 'transform 0.3s ease, filter 0.3s ease';
        kitten.addEventListener('mouseenter', () => {
            kitten.style.transform = 'scale(1.1)';
            kitten.style.filter = 'brightness(1.2) drop-shadow(0 0 10px rgba(255, 235, 59, 0.6))';
        });
        
        kitten.addEventListener('mouseleave', () => {
            kitten.style.transform = 'scale(1)';
            kitten.style.filter = 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2)) drop-shadow(0 0 8px rgba(255, 235, 59, 0.3))';
        });
        
        return kitten;
    }
    
    updateSpawnRate() {
        if (!this.startTime) {
            this.startTime = Date.now();
        }
        
        // Base rate acceleration over time
        const timeElapsed = Date.now() - this.startTime;
        const timeAcceleration = Math.min(timeElapsed / 60000, 1); // Over 1 minute
        
        // Movement-based rate modification
        const movementFactor = Math.min(this.movementSpeed / 50, 2); // Cap at 2x
        
        // Calculate new spawn rate
        this.currentSpawnRate = this.baseSpawnRate * this.rateAcceleration * (1 - timeAcceleration * 0.8);
        this.currentSpawnRate = Math.max(this.minSpawnRate, this.currentSpawnRate);
        this.currentSpawnRate = Math.min(this.maxSpawnRate, this.currentSpawnRate);
        
        // Apply movement multiplier
        if (movementFactor > 1) {
            this.currentSpawnRate /= movementFactor;
        }
        
        // Gradually increase base acceleration
        this.rateAcceleration = Math.max(0.95, this.rateAcceleration * 0.9995);
    }

    createCustomCursor() {
        this.cursorElement = document.createElement('div');
        this.cursorElement.id = 'custom-cursor';
        this.cursorElement.textContent = '🐾';
        document.body.appendChild(this.cursorElement);
    }
    
    start() {
        this.isRunning = true;
        this.createCustomCursor();
        this.startTime = Date.now();
        this.currentSpawnRate = this.baseSpawnRate;
        this.rateAcceleration = 0.98;
        
        // Start spawning kittens
        const spawnLoop = () => {
            if (!this.isRunning) return;
            
            if (this.container.children.length < 50) {
                this.spawnSingle();
            }
            
            this.updateSpawnRate();
            
            // Schedule next spawn
            setTimeout(spawnLoop, this.currentSpawnRate);
        };
        
        // Start the spawn loop
        spawnLoop();
        
        // Also spawn a few initial kittens
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.spawnSingle(), i * 500);
        }
    }
    
    stop() {
        this.isRunning = false;
        this.startTime = null;
        this.currentSpawnRate = this.baseSpawnRate;
        this.rateAcceleration = 0.98;
        this.movementSpeed = 0;
        this.movementHistory = [];
        
        // Clear existing kittens
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
        if (this.cursorElement) {
            this.cursorElement.remove();
            this.cursorElement = null;
        } 
    }
    
    spawnSingle() {
        if (!this.isRunning) return;
        
        const kitten = this.createKitten();
        this.container.appendChild(kitten);
        
        // Add a small particle effect at spawn
        this.createSparkle();
    }
    
    createSparkle() {
        const sparkle = document.createElement('div');
        sparkle.style.position = 'absolute';
        sparkle.style.left = `${this.cursorX}px`;
        sparkle.style.top = `${this.cursorY}px`;
        sparkle.style.width = '4px';
        sparkle.style.height = '4px';
        sparkle.style.borderRadius = '50%';
        sparkle.style.backgroundColor = '#ffeb3b';
        sparkle.style.pointerEvents = 'none';
        sparkle.style.zIndex = '5';
        
        const sparkleAnimation = sparkle.animate([
            { 
                transform: 'scale(0) rotate(0deg)',
                opacity: 1
            },
            { 
                transform: 'scale(1) rotate(180deg)',
                opacity: 1,
                offset: 0.5
            },
            { 
                transform: 'scale(0) rotate(360deg)',
                opacity: 0
            }
        ], {
            duration: 300,
            easing: 'ease-out'
        });
        
        this.container.appendChild(sparkle);
        
        sparkleAnimation.addEventListener('finish', () => {
            if (sparkle.parentNode) {
                sparkle.parentNode.removeChild(sparkle);
            }
        });
    }
}

// Export for use in overlay.js
window.KittenAnimation = KittenAnimation;
