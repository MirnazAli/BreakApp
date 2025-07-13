// src/renderer/overlay.js
class BreakOverlay {
    constructor() {
        this.config = {};
        this.breakTimer = null;
        this.breakInterval = null;
        this.rainAnimation = null;
        this.kittenAnimation = null;
        this.debug = true;
        this.blurOverlay = null;
        
        this.init();
    }
    
    log(message, data = null) {
        if (this.debug) {
            console.log('[BreakOverlay]', message, data);
        }
    }
    
    async init() {
        this.log('Initializing overlay...');
        
        // Load configuration
        await this.loadConfig();
        
        // Set up blur overlay
        this.setupBlurOverlay();
        
        // Set up animations
        this.setupAnimations();
        
        // Set up break timer
        this.setupBreakTimer();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start break
        this.startBreak();
        
        this.log('Overlay initialized successfully');
    }
    
    setupBlurOverlay() {
        this.log('Setting up progressive blur overlay...');
        
        // Create progressive blur overlay
        this.blurOverlay = document.createElement('div');
        this.blurOverlay.className = 'progressive-blur';
        
        // Insert it right after the overlay container
        const container = document.getElementById('overlay-container');
        if (container) {
            container.appendChild(this.blurOverlay);
        }
    }
    
    async loadConfig() {
        this.log('Loading config...');
        
        try {
            if (window.electronAPI && window.electronAPI.getConfig) {
                this.config = await window.electronAPI.getConfig();
                this.log('Config loaded:', this.config);
            } else {
                throw new Error('electronAPI not available');
            }
        } catch (error) {
            this.log('Error loading config, using defaults:', error);
            this.config = {
                breakDuration: 5,
                animationType: 'rain' // Changed from separate boolean flags
            };
        }
        
        // Convert legacy config if needed
        if (typeof this.config.enableKittens !== 'undefined' || typeof this.config.enableRain !== 'undefined') {
            this.log('Converting legacy config...');
            if (this.config.enableKittens && !this.config.enableRain) {
                this.config.animationType = 'kittens';
            } else if (this.config.enableRain && !this.config.enableKittens) {
                this.config.animationType = 'rain';
            } else if (!this.config.enableKittens && !this.config.enableRain) {
                this.config.animationType = 'none';
            } else {
                this.config.animationType = 'rain'; // Default to rain if both were enabled
            }
        }
        
        // Ensure animationType is set
        if (!this.config.animationType) {
            this.config.animationType = 'rain';
        }
    }
    
    setupAnimations() {
        this.log('Setting up animations...');
        
        // Initialize rain animation
        const rainCanvas = document.getElementById('rain-canvas');
        if (rainCanvas && window.RainAnimation) {
            this.rainAnimation = new RainAnimation(rainCanvas);
        } else {
            this.log('Rain animation not available');
        }
        
        // Initialize kitten animation
        const kittenContainer = document.getElementById('kitten-container');
        if (kittenContainer && window.KittenAnimation) {
            this.kittenAnimation = new KittenAnimation(kittenContainer);
        } else {
            this.log('Kitten animation not available');
        }
    }
    
    setupBreakTimer() {
        this.log('Setting up break timer for', this.config.breakDuration, 'minutes');
        
        this.breakTimer = this.config.breakDuration * 60; // Convert to seconds
        this.updateTimerDisplay();
    }
    
    setupEventListeners() {
        this.log('Setting up event listeners...');
        
        // End break button
        const endBreakBtn = document.getElementById('end-break-btn');
        if (endBreakBtn) {
            endBreakBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.log('End break button clicked');
                this.endBreak();
            });
        }
        
        // ESC key functionality
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                this.log('ESC key pressed');
                this.endBreak();
            }
        });
        
        // Prevent context menu
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    startBreak() {
        this.log('Starting break with animation type:', this.config.animationType);
        
        // Start the selected animation
        switch (this.config.animationType) {
            case 'rain':
                if (this.rainAnimation) {
                    this.log('Starting rain animation');
                    this.rainAnimation.start();
                } else {
                    this.log('Rain animation not available');
                }
                break;
                
            case 'kittens':
                if (this.kittenAnimation) {
                    this.log('Starting kitten animation');
                    this.kittenAnimation.start();
                } else {
                    this.log('Kitten animation not available');
                }
                break;
                
            case 'none':
                this.log('No animation selected');
                break;
                
            default:
                this.log('Unknown animation type, defaulting to rain');
                if (this.rainAnimation) {
                    this.rainAnimation.start();
                }
                break;
        }
        
        // Start progressive blur effect
        this.startProgressiveBlur();
        
        // Start countdown
        this.breakInterval = setInterval(() => {
            this.breakTimer--;
            this.updateTimerDisplay();
            
            this.log('Timer tick:', this.breakTimer);
            
            if (this.breakTimer <= 0) {
                this.log('Timer reached zero, ending break');
                this.endBreak();
            }
        }, 1000);
    }
    
    startProgressiveBlur() {
        this.log('Starting progressive blur effect...');
        
        const overlayContainer = document.getElementById('overlay-container');
        if (overlayContainer) {
            let blurIntensity = 0;
            const maxBlur = 3;
            const blurIncrement = maxBlur / (this.config.breakDuration * 60); // Spread over break duration
            
            const blurInterval = setInterval(() => {
                if (blurIntensity < maxBlur) {
                    blurIntensity += blurIncrement;
                    overlayContainer.style.backdropFilter = `blur(${blurIntensity}px)`;
                } else {
                    clearInterval(blurInterval);
                }
            }, 1000);
            
            // Store interval for cleanup
            this.blurInterval = blurInterval;
        }
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.breakTimer / 60);
        const seconds = this.breakTimer % 60;
        const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const timerElement = document.getElementById('break-timer');
        if (timerElement) {
            timerElement.textContent = display;
        } else {
            this.log('Timer element not found');
        }
    }
    
    async endBreak() {
        this.log('Ending break...');
        
        // Prevent multiple calls
        if (this.isEnding) {
            this.log('Already ending break, ignoring...');
            return;
        }
        this.isEnding = true;
        
        // Stop all animations
        if (this.rainAnimation) {
            this.log('Stopping rain animation');
            this.rainAnimation.stop();
        }
        
        if (this.kittenAnimation) {
            this.log('Stopping kitten animation');
            this.kittenAnimation.stop();
        }
        
        // Clear timers
        if (this.breakInterval) {
            clearInterval(this.breakInterval);
            this.breakInterval = null;
        }
        
        if (this.blurInterval) {
            clearInterval(this.blurInterval);
            this.blurInterval = null;
        }
        
        // Notify main process and close window
        try {
            if (window.electronAPI && window.electronAPI.endBreak) {
                this.log('Notifying main process to end break');
                await window.electronAPI.endBreak();
            } else {
                this.log('electronAPI.endBreak not available, closing window directly');
            }
        } catch (error) {
            this.log('Error ending break:', error);
        }
        
        // Force close the window after a short delay
        setTimeout(() => {
            this.log('Force closing window');
            if (window.close) {
                window.close();
            }
        }, 100);
    }
}

// Initialize overlay when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing BreakOverlay...');
    new BreakOverlay();
});

// Debug: Check if required globals are available
console.log('Available globals:', {
    electronAPI: !!window.electronAPI,
    RainAnimation: !!window.RainAnimation,
    KittenAnimation: !!window.KittenAnimation
});

// Additional safety: Listen for window beforeunload to cleanup
window.addEventListener('beforeunload', () => {
    console.log('Window is about to unload, performing cleanup...');
});