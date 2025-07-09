// src/utils/timer.js
class Timer {
    constructor(duration, onTick, onEnd) {
        this.duration = duration; // in seconds
        this.remaining = duration;
        this.onTick = onTick;
        this.onEnd = onEnd;
        this.interval = null;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.interval = setInterval(() => {
            this.remaining--;
            
            if (this.onTick) {
                this.onTick(this.remaining);
            }
            
            if (this.remaining <= 0) {
                this.stop();
                if (this.onEnd) {
                    this.onEnd();
                }
            }
        }, 1000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isRunning = false;
    }

    reset(newDuration) {
        this.stop();
        this.duration = newDuration || this.duration;
        this.remaining = this.duration;
    }

    getFormattedTime() {
        const minutes = Math.floor(this.remaining / 60);
        const seconds = this.remaining % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    static formatSeconds(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Timer;
} else {
    window.Timer = Timer;
}