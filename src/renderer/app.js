// src/renderer/app.js
class BreakApp {
    constructor() {
        this.config = {};
        this.countdown = null;
        this.countdownInterval = null;
        this.init();
    }

    async init() {
        // Load configuration
        await this.loadConfig();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Update UI with current config
        this.updateUI();
        
        // Start countdown display
        this.startCountdown();
    }

    async loadConfig() {
        try {
            this.config = await window.electronAPI.getConfig();
            console.log('Config loaded:', this.config);
        } catch (error) {
            console.error('Error loading config:', error);
            // Default config
            this.config = {
                breakInterval: 25,
                breakDuration: 5,
                enableKittens: true,
                enableRain: true
            };
        }
    }

    setupEventListeners() {
        // Break now button
        document.getElementById('break-now-btn').addEventListener('click', () => {
            this.triggerBreak();
        });

        // Save settings button
        document.getElementById('save-settings-btn').addEventListener('click', () => {
            this.saveSettings();
        });

        // Preview buttons
        document.getElementById('preview-rain-btn').addEventListener('click', () => {
            this.previewRain();
        });

        document.getElementById('preview-kittens-btn').addEventListener('click', () => {
            this.previewKittens();
        });

        // Input change listeners
        document.getElementById('break-interval').addEventListener('change', (e) => {
            this.config.breakInterval = parseInt(e.target.value);
            this.restartCountdown();
        });

        document.getElementById('break-duration').addEventListener('change', (e) => {
            this.config.breakDuration = parseInt(e.target.value);
        });

        document.getElementById('enable-rain').addEventListener('change', (e) => {
            this.config.enableRain = e.target.checked;
        });

        document.getElementById('enable-kittens').addEventListener('change', (e) => {
            this.config.enableKittens = e.target.checked;
        });
    }

    updateUI() {
        document.getElementById('break-interval').value = this.config.breakInterval;
        document.getElementById('break-duration').value = this.config.breakDuration;
        document.getElementById('enable-rain').checked = this.config.enableRain;
        document.getElementById('enable-kittens').checked = this.config.enableKittens;
    }

    startCountdown() {
        this.countdown = this.config.breakInterval * 60; // Convert to seconds
        this.updateCountdownDisplay();
        
        this.countdownInterval = setInterval(() => {
            this.countdown--;
            this.updateCountdownDisplay();
            
            if (this.countdown <= 0) {
                this.triggerBreak();
            }
        }, 1000);
    }

    restartCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        this.startCountdown();
    }

    updateCountdownDisplay() {
        const minutes = Math.floor(this.countdown / 60);
        const seconds = this.countdown % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('countdown').textContent = display;
    }

    async triggerBreak() {
        try {
            await window.electronAPI.triggerBreak();
            this.restartCountdown();
        } catch (error) {
            console.error('Error triggering break:', error);
        }
    }

    async saveSettings() {
        try {
            await window.electronAPI.updateConfig(this.config);
            this.showNotification('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Error saving settings', 'error');
        }
    }

    previewRain() {
        this.showNotification('Rain preview would open here');
        // TODO: Implement rain preview
    }

    previewKittens() {
        this.showNotification('Kitten preview would open here');
        // TODO: Implement kitten preview
    }

    showNotification(message, type = 'success') {
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
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
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
`;
document.head.appendChild(style);

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BreakApp();
});