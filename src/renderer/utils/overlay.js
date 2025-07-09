// src/renderer/overlay.js
class BreakOverlay {
    constructor() {
        this.config = {};
        this.breakTimer = null;
        this.breakInterval = null;
        this.rainAnimation = null;
        this.kittenAnimation = null;
        
        this.init();
    }
    
    async init() {
        // Load configuration
        await this.loadConfig();
        
        // Set up animations
        this.setupAnimations();
        
        // Set up break timer
        this.setupBreakTimer();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start break
        this.startBreak();
    }
    
    async loadConfig() {
        try {
            this.config = await window.electronAPI.getConfig();
        } catch (error) {
            console.error('Error loading config:', error);
            this.config = {
                breakDuration: 5,
                enableKittens: true,
                enableRain: true
            };
        }
    }
    
    setupAnimations() {
        // Initialize rain animation
        const rainCanvas = document.getElementById('rain-canvas');
        this.rainAnimation = new RainAnimation(rainCanvas);
        
        // Initialize kitten animation
        const kittenContainer = document.getElementById('kitten-container');
        this.kittenAnimation = new KittenAnimation(kittenContainer);
    }
    
    setupBreakTimer() {
        this.breakTimer = this.config.breakDuration * 60; // Convert to seconds
        this.updateTimerDisplay();
    }
    
    setupEventListeners() {
        // End break button
        document.getElementById('end-break-btn').addEventListener('click', () => {
            this.endBreak();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.endBreak();
            }
        });
    }
    
    startBreak() {
        // Start animations if enabled
        if (this.config.enableRain) {
            this.rainAnimation.start();
        }
        
        if (this.config.enableKittens) {
            this.kittenAnimation.start();
        }
        
        // Start countdown
        this.breakInterval = setInterval(() => {
            this.breakTimer--;
            this.updateTimerDisplay();
            
            if (this.breakTimer <= 0) {
                this.endBreak();
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.breakTimer / 60);
        const seconds = this.breakTimer % 60;
        const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('break-timer').textContent = display;
    }
    
    async endBreak() {
        // Stop animations
        if (this.rainAnimation) {
            this.rainAnimation.stop();
        }
        
        if (this.kittenAnimation) {
            this.kittenAnimation.stop();
        }
        
        // Clear timer
        if (this.breakInterval) {
            clearInterval(this.breakInterval);
        }
        
        // Notify main process
        try {
            await window.electronAPI.endBreak();
        } catch (error) {
            console.error('Error ending break:', error);
        }
    }
}

// Initialize overlay when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BreakOverlay();
});