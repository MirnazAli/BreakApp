// src/renderer/animations/rain.js
class RainAnimation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.rainDrops = [];
        this.isRunning = false;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createRainDrop() {
        return {
            x: Math.random() * this.canvas.width,
            y: -20,
            speed: Math.random() * 3 + 2,
            length: Math.random() * 15 + 10,
            opacity: Math.random() * 0.5 + 0.3
        };
    }
    
    start() {
        this.isRunning = true;
        this.animate();
        
        // Add new drops periodically
        this.dropInterval = setInterval(() => {
            if (this.rainDrops.length < 200) {
                this.rainDrops.push(this.createRainDrop());
            }
        }, 50);
    }
    
    stop() {
        this.isRunning = false;
        if (this.dropInterval) {
            clearInterval(this.dropInterval);
        }
    }
    
    animate() {
        if (!this.isRunning) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw rain drops
        this.rainDrops = this.rainDrops.filter(drop => {
            drop.y += drop.speed;
            
            // Draw the drop
            this.ctx.globalAlpha = drop.opacity;
            this.ctx.strokeStyle = '#aec2e0';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(drop.x, drop.y);
            this.ctx.lineTo(drop.x, drop.y + drop.length);
            this.ctx.stroke();
            
            // Remove drops that are off screen
            return drop.y < this.canvas.height + 50;
        });
        
        this.ctx.globalAlpha = 1;
        requestAnimationFrame(() => this.animate());
    }
}

// Export for use in overlay.js
window.RainAnimation = RainAnimation;