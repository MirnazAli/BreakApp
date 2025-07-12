// src/renderer/animations/rain.js
class RainAnimation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.rainDrops = [];
        this.waterDroplets = [];
        this.streaks = [];
        this.isRunning = false;
        this.blurIntensity = 0;
        this.maxBlurIntensity = 15;
        
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
            y: Math.random() * this.canvas.height,
            radius: Math.random() * 8 + 4,
            opacity: Math.random() * 0.4 + 0.3,
            life: 1.0,
            maxLife: Math.random() * 60 + 120, // frames
            ripples: [],
            hasStreaked: false
        };
    }
    
    createWaterDroplet(x, y) {
        return {
            x: x,
            y: y,
            radius: Math.random() * 3 + 2,
            opacity: Math.random() * 0.6 + 0.4,
            life: 1.0,
            maxLife: Math.random() * 180 + 300,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 0.5 + 0.1,
            gravity: 0.02
        };
    }
    
    createStreak(x, y) {
        return {
            x: x,
            y: y,
            length: Math.random() * 40 + 20,
            width: Math.random() * 2 + 1,
            opacity: Math.random() * 0.4 + 0.2,
            life: 1.0,
            maxLife: Math.random() * 120 + 240,
            angle: Math.random() * Math.PI * 0.2 + Math.PI * 0.4, // Slight downward angle
            speed: Math.random() * 0.5 + 0.3
        };
    }
    
    start() {
        this.isRunning = true;
        this.animate();
        
        // Create initial droplets
        this.dropInterval = setInterval(() => {
            if (this.rainDrops.length < 50) {
                this.rainDrops.push(this.createRainDrop());
            }
        }, 200);
        
        // Create water droplets periodically
        this.dropletInterval = setInterval(() => {
            if (this.waterDroplets.length < 30) {
                this.waterDroplets.push(this.createWaterDroplet(
                    Math.random() * this.canvas.width,
                    Math.random() * this.canvas.height * 0.8
                ));
            }
        }, 400);
    }
    
    stop() {
        this.isRunning = false;
        if (this.dropInterval) {
            clearInterval(this.dropInterval);
        }
        if (this.dropletInterval) {
            clearInterval(this.dropletInterval);
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.style.display = 'none';
    }
    
    drawRainDrop(drop) {
        const alpha = drop.opacity * drop.life;
        
        // Main droplet with gradient
        const gradient = this.ctx.createRadialGradient(
            drop.x, drop.y, 0,
            drop.x, drop.y, drop.radius
        );
        gradient.addColorStop(0, `rgba(200, 220, 255, ${alpha * 0.8})`);
        gradient.addColorStop(0.7, `rgba(150, 180, 255, ${alpha * 0.6})`);
        gradient.addColorStop(1, `rgba(100, 140, 255, ${alpha * 0.2})`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Highlight
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
        this.ctx.beginPath();
        this.ctx.arc(drop.x - drop.radius * 0.3, drop.y - drop.radius * 0.3, drop.radius * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ripples when drop is fresh
        if (drop.life > 0.8) {
            for (let i = 0; i < 3; i++) {
                const rippleRadius = (1 - drop.life) * 30 + i * 10;
                const rippleAlpha = (drop.life - 0.8) * 5 * (1 - i * 0.3);
                
                this.ctx.strokeStyle = `rgba(150, 180, 255, ${rippleAlpha * 0.3})`;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(drop.x, drop.y, rippleRadius, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
    }
    
    drawWaterDroplet(droplet) {
        const alpha = droplet.opacity * droplet.life;
        
        // Water droplet with more realistic appearance
        const gradient = this.ctx.createRadialGradient(
            droplet.x, droplet.y, 0,
            droplet.x, droplet.y, droplet.radius
        );
        gradient.addColorStop(0, `rgba(220, 240, 255, ${alpha * 0.9})`);
        gradient.addColorStop(0.6, `rgba(180, 220, 255, ${alpha * 0.7})`);
        gradient.addColorStop(1, `rgba(120, 180, 255, ${alpha * 0.3})`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(droplet.x, droplet.y, droplet.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Surface tension effect
        this.ctx.strokeStyle = `rgba(100, 160, 255, ${alpha * 0.5})`;
        this.ctx.lineWidth = 0.5;
        this.ctx.beginPath();
        this.ctx.arc(droplet.x, droplet.y, droplet.radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    drawStreak(streak) {
        const alpha = streak.opacity * streak.life;
        
        const endX = streak.x + Math.cos(streak.angle) * streak.length;
        const endY = streak.y + Math.sin(streak.angle) * streak.length;
        
        // Gradient along the streak
        const gradient = this.ctx.createLinearGradient(
            streak.x, streak.y, endX, endY
        );
        gradient.addColorStop(0, `rgba(180, 220, 255, ${alpha * 0.8})`);
        gradient.addColorStop(0.7, `rgba(150, 200, 255, ${alpha * 0.6})`);
        gradient.addColorStop(1, `rgba(120, 180, 255, ${alpha * 0.2})`);
        
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = streak.width;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(streak.x, streak.y);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
    }
    
    animate() {
        if (!this.isRunning) return;
        
        // Create glass fogging effect
        this.ctx.fillStyle = `rgba(240, 245, 255, 0.01)`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Gradually increase blur intensity
        if (this.blurIntensity < this.maxBlurIntensity) {
            this.blurIntensity += 0.05;
        }
        
        // Apply blur filter to canvas
        this.canvas.style.filter = `blur(${this.blurIntensity * 0.3}px)`;
        
        // Update and draw rain drops
        this.rainDrops = this.rainDrops.filter(drop => {
            drop.life -= 1 / drop.maxLife;
            
            // Create streak when drop is about to fade
            if (drop.life < 0.7 && !drop.hasStreaked && Math.random() < 0.3) {
                this.streaks.push(this.createStreak(drop.x, drop.y));
                drop.hasStreaked = true;
            }
            
            // Create smaller droplets as the main drop evaporates
            if (drop.life < 0.5 && Math.random() < 0.05) {
                this.waterDroplets.push(this.createWaterDroplet(
                    drop.x + (Math.random() - 0.5) * 20,
                    drop.y + (Math.random() - 0.5) * 20
                ));
            }
            
            if (drop.life > 0) {
                this.drawRainDrop(drop);
                return true;
            }
            return false;
        });
        
        // Update and draw water droplets
        this.waterDroplets = this.waterDroplets.filter(droplet => {
            droplet.life -= 1 / droplet.maxLife;
            droplet.x += droplet.vx;
            droplet.y += droplet.vy;
            droplet.vy += droplet.gravity;
            
            // Bounce off edges
            if (droplet.x <= droplet.radius || droplet.x >= this.canvas.width - droplet.radius) {
                droplet.vx *= -0.5;
            }
            if (droplet.y >= this.canvas.height - droplet.radius) {
                droplet.vy *= -0.3;
                droplet.y = this.canvas.height - droplet.radius;
            }
            
            if (droplet.life > 0) {
                this.drawWaterDroplet(droplet);
                return true;
            }
            return false;
        });
        
        // Update and draw streaks
        this.streaks = this.streaks.filter(streak => {
            streak.life -= 1 / streak.maxLife;
            streak.y += streak.speed;
            
            if (streak.life > 0 && streak.y < this.canvas.height) {
                this.drawStreak(streak);
                return true;
            }
            return false;
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// Export for use in overlay.js
window.RainAnimation = RainAnimation;