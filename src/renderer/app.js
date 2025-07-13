// src/renderer/app.js
class BreakApp {
    constructor() {
        this.config = {};
        this.countdown = null;
        this.countdownInterval = null;
        this.animation = null;
        this.previewTimer = 10;
        this.previewInterval = null;
        this.debug = true;
        this.init();
    }

    log(message, data = null) {
        if (this.debug) {
            console.log('[BreakApp]', message, data);
            // Also send to main process for debugging
            if (window.electronAPI && window.electronAPI.debugLog) {
                window.electronAPI.debugLog(`[BreakApp] ${message} ${data ? JSON.stringify(data) : ''}`);
            }
        }
    }

    async init() {
        this.log('Initializing app...');
        
        try {
            // Load configuration
            await this.loadConfig();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Update UI with current config
            this.updateUI();
            
            // Start countdown display
            this.startCountdown();
            
            this.log('App initialized successfully');
        } catch (error) {
            this.log('Error initializing app:', error);
            console.error('Error initializing app:', error);
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
            // Default config
            this.config = {
                breakInterval: 25,
                breakDuration: 5,
                animationType: 'rain' // Changed from separate boolean flags to single animation type
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
            
            // Remove legacy properties
            delete this.config.enableKittens;
            delete this.config.enableRain;
        }
        
        // Ensure animationType is set
        if (!this.config.animationType) {
            this.config.animationType = 'rain';
        }
    }

    setupEventListeners() {
        this.log('Setting up event listeners...');
        
        // Break now button
        const breakNowBtn = document.getElementById('break-now-btn');
        if (breakNowBtn) {
            breakNowBtn.addEventListener('click', () => {
                this.log('Break now button clicked');
                this.triggerBreak();
            });
        }

        // Save settings button
        const saveBtn = document.getElementById('save-settings-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.log('Save settings button clicked');
                this.saveSettings();
            });
        }

        // Preview buttons
        const previewRainBtn = document.getElementById('preview-rain-btn');
        if (previewRainBtn) {
            previewRainBtn.addEventListener('click', () => {
                this.log('Preview rain button clicked');
                this.previewRain();
            });
        }

        const previewKittensBtn = document.getElementById('preview-kittens-btn');
        if (previewKittensBtn) {
            previewKittensBtn.addEventListener('click', () => {
                this.log('Preview kittens button clicked');
                this.previewKittens();
            });
        }

        // Input change listeners
        const breakIntervalInput = document.getElementById('break-interval');
        if (breakIntervalInput) {
            breakIntervalInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                this.log('Break interval changed to:', value);
                this.config.breakInterval = value;
                this.restartCountdown();
            });
        }

        const breakDurationInput = document.getElementById('break-duration');
        if (breakDurationInput) {
            breakDurationInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                this.log('Break duration changed to:', value);
                this.config.breakDuration = value;
            });
        }

        // Animation radio button listeners
        const animationRadios = document.querySelectorAll('input[name="animation"]');
        animationRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.log('Animation type changed to:', e.target.value);
                    this.config.animationType = e.target.value;
                }
            });
        });
    }

    updateUI() {
        this.log('Updating UI with config:', this.config);
        
        const breakInterval = document.getElementById('break-interval');
        const breakDuration = document.getElementById('break-duration');
        
        if (breakInterval) breakInterval.value = this.config.breakInterval;
        if (breakDuration) breakDuration.value = this.config.breakDuration;
        
        // Update radio buttons
        const animationRadios = document.querySelectorAll('input[name="animation"]');
        animationRadios.forEach(radio => {
            radio.checked = radio.value === this.config.animationType;
        });
    }

    startCountdown() {
        this.log('Starting countdown...');
        
        this.countdown = this.config.breakInterval * 60; // Convert to seconds
        this.updateCountdownDisplay();
        
        this.countdownInterval = setInterval(() => {
            this.countdown--;
            this.updateCountdownDisplay();
            
            if (this.countdown <= 0) {
                this.log('Countdown reached zero, triggering break');
                this.triggerBreak();
            }
        }, 1000);
    }

    restartCountdown() {
        this.log('Restarting countdown...');
        
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        this.startCountdown();
    }

    updateCountdownDisplay() {
        const minutes = Math.floor(this.countdown / 60);
        const seconds = this.countdown % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const countdownElement = document.getElementById('countdown');
        if (countdownElement) {
            countdownElement.textContent = display;
        } else {
            this.log('Countdown element not found');
        }
    }

    async triggerBreak() {
        this.log('Triggering break...');
        
        try {
            if (window.electronAPI && window.electronAPI.triggerBreak) {
                await window.electronAPI.triggerBreak();
                this.restartCountdown();
                this.showNotification('Break started!');
            } else {
                throw new Error('electronAPI.triggerBreak not available');
            }
        } catch (error) {
            this.log('Error triggering break:', error);
            this.showNotification('Error starting break', 'error');
        }
    }

    async saveSettings() {
        this.log('Saving settings:', this.config);
        
        try {
            if (window.electronAPI && window.electronAPI.updateConfig) {
                await window.electronAPI.updateConfig(this.config);
                this.showNotification('Settings saved successfully!');
                this.log('Settings saved successfully');
            } else {
                throw new Error('electronAPI.updateConfig not available');
            }
        } catch (error) {
            this.log('Error saving settings:', error);
            this.showNotification('Error saving settings', 'error');
        }
    }

    previewRain() {
        this.log('Preview rain requested');
        
        // Stop any existing preview
        this.stopPreview();
        
        this.showNotification('Rain preview - this will show rain animation during breaks');
        
        // Initialize rain animation
        const rainCanvas = document.getElementById('rain-canvas');
        if (rainCanvas && window.RainAnimation) {
            this.animation = new RainAnimation(rainCanvas);
            this.animation.start();
        } else {
            this.log('Rain animation not available');
            this.showNotification('Rain animation not available', 'error');
            return;
        }
        
        // Start preview timer
        this.previewTimer = 10;
        this.previewInterval = setInterval(() => {
            this.previewTimer--;
            this.log('Preview timer tick:', this.previewTimer);
            
            if (this.previewTimer <= 0) {
                this.log('Preview timer reached zero, stopping rain preview');
                this.stopPreview();
            }
        }, 1000);
    }

    previewKittens() {
        this.log('Preview kittens requested');
        
        // Stop any existing preview
        this.stopPreview();
        
        this.showNotification('Kitten preview - this will show falling kittens during breaks');

        // Initialize kitten animation
        const kittenContainer = document.getElementById('kitten-container');
        if (kittenContainer && window.KittenAnimation) {
            this.animation = new KittenAnimation(kittenContainer);
            this.animation.start();
        } else {
            this.log('Kitten animation not available');
            this.showNotification('Kitten animation not available', 'error');
            return;
        }
        
        // Start preview timer
        this.previewTimer = 10;
        this.previewInterval = setInterval(() => {
            this.previewTimer--;
            this.log('Preview timer tick:', this.previewTimer);
            
            if (this.previewTimer <= 0) {
                this.log('Preview timer reached zero, stopping kitten preview');
                this.stopPreview();
            }
        }, 1000);
    }

    stopPreview() {
        this.log('Stopping preview...');
        
        // Clear preview timer
        if (this.previewInterval) {
            clearInterval(this.previewInterval);
            this.previewInterval = null;
        }
        
        // Stop animation
        if (this.animation) {
            this.animation.stop();
            this.animation = null;
        }
        
        // Reset timer
        this.previewTimer = 10;
    }

    showNotification(message, type = 'success') {
        this.log('Showing notification:', { message, type });
        
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease-in-out;
            max-width: 300px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing BreakApp...');
    new BreakApp();
});

// Debug: Check if electronAPI is available
console.log('electronAPI available:', !!window.electronAPI);
if (window.electronAPI) {
    console.log('electronAPI methods:', Object.keys(window.electronAPI));
}