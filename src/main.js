const { app, BrowserWindow, Tray, Menu, ipcMain, screen } = require('electron');
const path = require('path');
const Store = require('electron-store').default;
const schedule = require('node-schedule');

// Initialize store for app settings
const store = new Store();

let mainWindow = null;
let overlayWindow = null;
let tray = null;
let breakTimer = null;

// App configuration
const config = {
    breakInterval: store.get('breakInterval', 25), // minutes
    breakDuration: store.get('breakDuration', 5),   // minutes
    enableKittens: store.get('enableKittens', true),
    enableRain: store.get('enableRain', true)
};

function createTray() {
    const iconPath = path.join(__dirname, '../assets/icons/icon.png');
    tray = new Tray(iconPath);
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Take Break Now',
            click: () => startBreakMode()
        },
        {
            label: 'Settings',
            click: () => showSettings()
        },
        {
            label: 'Quit',
            click: () => app.quit()
        }
    ]);
    
    tray.setToolTip('Kitten Break App');
    tray.setContextMenu(contextMenu);
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 400,
        height: 600,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
    
    // Hide window instead of closing
    mainWindow.on('close', (event) => {
        event.preventDefault();
        mainWindow.hide();
    });
}

function createOverlayWindow() {
    const displays = screen.getAllDisplays();
    const overlays = [];
    
    displays.forEach((display) => {
        const overlay = new BrowserWindow({
            x: display.bounds.x,
            y: display.bounds.y,
            width: display.bounds.width,
            height: display.bounds.height,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            skipTaskbar: true,
            resizable: false,
            movable: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            }
        });

        overlay.loadFile(path.join(__dirname, 'renderer/overlay.html'));
        overlay.setIgnoreMouseEvents(false);
        overlays.push(overlay);
    });
    
    overlayWindow = overlays; // Store array of overlays
}


function startBreakMode() {
    console.log('Starting break mode...');
    createOverlayWindow();
    
    // Schedule break end
    setTimeout(() => {
        endBreakMode();
    }, config.breakDuration * 60 * 1000);
}

function endBreakMode() {
    console.log('Ending break mode...');
    if (overlayWindow) {
        if (Array.isArray(overlayWindow)) {
            overlayWindow.forEach(window => window.close());
        } else {
            overlayWindow.close();
        }
        overlayWindow = null;
    }
    scheduleNextBreak();
}

function scheduleNextBreak() {
    if (breakTimer) {
        clearTimeout(breakTimer);
    }
    
    const nextBreak = config.breakInterval * 60 * 1000;
    breakTimer = setTimeout(() => {
        startBreakMode();
    }, nextBreak);
    
    console.log(`Next break scheduled in ${config.breakInterval} minutes`);
}

function showSettings() {
    if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
    }
}

// App event handlers
app.whenReady().then(() => {
    createTray();
    createMainWindow();
    scheduleNextBreak();
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // Keep app running in background
});

app.on('before-quit', () => {
    if (breakTimer) {
        clearTimeout(breakTimer);
    }
});

// IPC handlers for communication with renderer
ipcMain.handle('get-config', () => config);

ipcMain.handle('update-config', (event, newConfig) => {
    Object.assign(config, newConfig);
    store.set(config);
    
    // Reschedule if interval changed
    if (newConfig.breakInterval) {
        scheduleNextBreak();
    }
    
    return config;
});

ipcMain.handle('trigger-break', () => {
    startBreakMode();
});

ipcMain.handle('end-break', () => {
    endBreakMode();
});