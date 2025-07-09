// src/renderer/animations/kittens.js
class KittenAnimation {
    constructor(container) {
        this.container = container;
        this.kittens = [];
        this.isRunning = false;
        this.spawnInterval = null;
    }
    
    createKitten() {
        const kitten = document.createElement('div');
        kitten.className = 'kitten';
        
        // Random horizontal position
        const x = Math.random() * (window.innerWidth - 60);
        kitten.style.left = `${x}px`;
        
        // Random animation duration
        const duration = Math.random() * 2 + 2; // 2-4 seconds
        kitten.style.animationDuration = `${duration}s`;
        
        // Random kitten colors
        const colors = ['#ff9800', '#ff5722', '#795548', '#9e9e9e', '#607d8b'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Create SVG kitten
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="25" fill="${color}"/>
                <circle cx="40" cy="45" r="3" fill="#333"/>
                <circle cx="60" cy="45" r="3" fill="#333"/>
                <path d="M35 30 L40 20 L45 30 Z" fill="${color}"/>
                <path d="M55 30 L60 20 L65 30 Z" fill="${color}"/>
                <path d="M45 55 Q50 60 55 55" stroke="#333" stroke-width="2" fill="none"/>
                <circle cx="50" cy="52" r="1" fill="#ff69b4"/>
            </svg>
        `;
        
        kitten.innerHTML = svg;
        
        // Remove kitten after animation
        kitten.addEventListener('animationend', () => {
            if (kitten.parentNode) {
                kitten.parentNode.removeChild(kitten);
            }
        });
        
        return kitten;
    }
    
    start() {
        this.isRunning = true;
        
        // Spawn kittens periodically
        this.spawnInterval = setInterval(() => {
            if (this.isRunning && this.container.children.length < 20) {
                const kitten = this.createKitten();
                this.container.appendChild(kitten);
            }
        }, 800);
    }
    
    stop() {
        this.isRunning = false;
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
        }
        
        // Clear existing kittens
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
    }
    
    spawnSingle() {
        const kitten = this.createKitten();
        this.container.appendChild(kitten);
    }
}

// Export for use in overlay.js
window.KittenAnimation = KittenAnimation;