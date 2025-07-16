const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store').default;

// Initialize store for app settings
const store = new Store();

let mainWindow = null;
let overlayWindows = [];
let tray = null;
let breakTimer = null;
let breakEndTimer = null;

// App configuration with updated structure
const config = {
    breakInterval: store.get('breakInterval', 25), // minutes
    breakDuration: store.get('breakDuration', 5),   // minutes
    animationType: store.get('animationType', 'rain') // 'rain', 'kittens', or 'none'
};

// Convert legacy config if needed
if (store.has('enableKittens') || store.has('enableRain')) {
    console.log('Converting legacy config...');
    const enableKittens = store.get('enableKittens', false);
    const enableRain = store.get('enableRain', true);
    
    if (enableKittens && !enableRain) {
        config.animationType = 'kittens';
    } else if (enableRain && !enableKittens) {
        config.animationType = 'rain';
    } else if (!enableKittens && !enableRain) {
        config.animationType = 'none';
    } else {
        config.animationType = 'rain'; // Default to rain if both were enabled
    }
    
    // Save the new config and remove old keys
    store.set('animationType', config.animationType);
    store.delete('enableKittens');
    store.delete('enableRain');
}

console.log('Initial config:', config);

function createTray() {
    // Use a simple icon path or create a basic one
    const iconPath = path.join(__dirname, '../assets/icons/icon.png');
    
    try {
        tray = new Tray(iconPath);
    } catch (error) {
        console.log('Could not load tray icon, using default');
        // Create a simple 16x16 icon programmatically if needed
        tray = new Tray(nativeImage.createEmpty());
    }
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show Settings',
            click: () => showSettings()
        },
        {
            label: 'Take Break Now',
            click: () => startBreakMode()
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => app.quit()
        }
    ]);
    
    tray.setToolTip('Break App');
    tray.setContextMenu(contextMenu);
    
    // Show settings on double click
    tray.on('double-click', () => {
        showSettings();
    });
}

function createMainWindow() {
    console.log('Creating main window...');
    
    mainWindow = new BrowserWindow({
        width: 400,
        height: 700,
        show: true, // Show immediately for debugging
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets/icons/icon.png')
    });

    const htmlPath = path.join(__dirname, 'renderer/index.html');
    console.log('Loading HTML from:', htmlPath);
    
    mainWindow.loadFile(htmlPath);
    
    // Log when page is loaded
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('Main window loaded successfully');
    });
    
    // Handle window close
    mainWindow.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
    
    // Handle errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load main window:', errorCode, errorDescription);
    });
}

function createOverlayWindow() {
    console.log('Creating overlay window...');
    
    // Clear any existing break end timer
    if (breakEndTimer) {
        clearTimeout(breakEndTimer);
        breakEndTimer = null;
    }
    
    const displays = screen.getAllDisplays();
    overlayWindows = [];
    
    displays.forEach((display, index) => {
        console.log(`Creating overlay for display ${index}:`, display.bounds);
        
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
            show: true, // Show immediately
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            }
        });

        const overlayPath = path.join(__dirname, 'renderer/overlay.html');
        console.log('Loading overlay HTML from:', overlayPath);
        
        overlay.loadFile(overlayPath);
        
        // Log when overlay is loaded
        overlay.webContents.on('did-finish-load', () => {
            console.log(`Overlay ${index} loaded successfully`);
        });
        
        // Handle overlay errors
        overlay.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            console.error(`Overlay ${index} failed to load:`, errorCode, errorDescription);
        });
        
        // Handle overlay close
        overlay.on('closed', () => {
            console.log(`Overlay ${index} closed`);
            // Remove from array
            const windowIndex = overlayWindows.indexOf(overlay);
            if (windowIndex > -1) {
                overlayWindows.splice(windowIndex, 1);
            }
        });
        
        overlay.setIgnoreMouseEvents(false);
        overlayWindows.push(overlay);
    });
    
    // Set up automatic break end timer
    const breakDuration = config.breakDuration * 60 * 1000;
    console.log(`Break will end automatically in ${config.breakDuration} minutes`);
    
    breakEndTimer = setTimeout(() => {
        console.log('Automatic break end timer triggered');
        endBreakMode();
    }, breakDuration);
}

function startBreakMode() {
    console.log('Starting break mode...');
    
    // End any existing break first
    if (overlayWindows.length > 0) {
        console.log('Ending existing break before starting new one');
        endBreakMode();
    }
    
    createOverlayWindow();
}

function endBreakMode() {
    console.log('Ending break mode...');
    
    // Clear break end timer
    if (breakEndTimer) {
        clearTimeout(breakEndTimer);
        breakEndTimer = null;
    }
    
    // Close all overlay windows
    const windowsToClose = [...overlayWindows]; // Create a copy to avoid modification during iteration
    overlayWindows = [];
    
    windowsToClose.forEach((window, index) => {
        if (window && !window.isDestroyed()) {
            console.log(`Closing overlay window ${index}`);
            try {
                window.close();
            } catch (error) {
                console.error(`Error closing overlay window ${index}:`, error);
            }
        }
    });
    
    console.log('All overlay windows closed, scheduling next break');
    
    // Notify renderer process that break ended
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('break-ended');
    }
    
    scheduleNextBreak();  // Schedule the next break
}

function scheduleNextBreak() {
    if (breakTimer) {
        clearTimeout(breakTimer);
    }
    
    const nextBreak = config.breakInterval * 60 * 1000;
    console.log(`Next break scheduled in ${config.breakInterval} minutes`);
    
    breakTimer = setTimeout(() => {
        startBreakMode();
    }, nextBreak);
}

function showSettings() {
    if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
    } else {
        createMainWindow();
    }
}

// App event handlers
app.whenReady().then(() => {
    console.log('App ready, initializing...');
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
    // Keep app running in background on macOS
    if (process.platform !== 'darwin') {
        // On other platforms, keep running
    }
});

app.on('before-quit', () => {
    console.log('App quitting...');
    app.isQuiting = true;
    
    if (breakTimer) {
        clearTimeout(breakTimer);
    }
    
    if (breakEndTimer) {
        clearTimeout(breakEndTimer);
    }
    
    // Close all overlay windows
    overlayWindows.forEach(window => {
        if (window && !window.isDestroyed()) {
            window.close();
        }
    });
});

// IPC handlers for communication with renderer
ipcMain.handle('get-config', () => {
    console.log('Sending config to renderer:', config);
    return config;
});

ipcMain.handle('update-config', (event, newConfig) => {
    console.log('Updating config:', newConfig);
    
    Object.assign(config, newConfig);
    
    // Save to store
    store.set('breakInterval', config.breakInterval);
    store.set('breakDuration', config.breakDuration);
    store.set('animationType', config.animationType);
    console.log('Config saved:', config);
    
    // Reschedule if interval changed
    if (newConfig.breakInterval) {
        scheduleNextBreak();
    }
    
    return config;
});

ipcMain.handle('trigger-break', () => {
    console.log('Break triggered from renderer');
    startBreakMode();
    return true;
});

ipcMain.handle('end-break', () => {
    console.log('Break end requested from renderer');
    endBreakMode();
    return true;
});

// Add debugging IPC
ipcMain.handle('debug-log', (event, message) => {
    console.log('Renderer log:', message);
});

// Add this to your main process code
ipcMain.on('end-break', () => {
    // Notify renderer process that break ended
    mainWindow.webContents.send('break-ended');
});

// Expose the break-ended event to renderer
ipcMain.handle('on-break-ended', (event) => {
    // Setup listener in renderer
});

console.log('Main process initialized');