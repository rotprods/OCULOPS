// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — Electron Main Process
// ═══════════════════════════════════════════════════

const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, Notification, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray;

const isDev = process.env.NODE_ENV === 'development';

function isAppNavigation(url) {
    if (!url) return false;
    if (url.startsWith('file://')) return true;
    return isDev && url.startsWith('http://localhost:5173');
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        title: 'ANTIGRAVITY OS',
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#0a0e17',
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            sandbox: false, // required for preload script access
        },
        icon: path.join(__dirname, '../public/icon.png'),
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Block navigation to external URLs — open in browser instead
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (isAppNavigation(url)) return;
        event.preventDefault();
        if (url.startsWith('http://') || url.startsWith('https://')) {
            shell.openExternal(url);
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createTray() {
    const icon = nativeImage.createFromDataURL(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    );
    tray = new Tray(icon);
    tray.setToolTip('ANTIGRAVITY OS');

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Open Antigravity', click: () => mainWindow?.show() },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() },
    ]);
    tray.setContextMenu(contextMenu);
}

// ── IPC Handlers ──────────────────────────────────

// Window controls
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow?.maximize();
    }
});
ipcMain.on('window:close', () => mainWindow?.close());

// Native notifications
ipcMain.on('notification:show', (_event, { title, body }) => {
    if (Notification.isSupported()) {
        new Notification({ title, body }).show();
    }
});

// File save — restricted to Downloads/AntigravityOS, no path traversal
ipcMain.handle('file:save', async (_event, { data, filename }) => {
    try {
        const safeName = path.basename(filename);
        if (!safeName || safeName.includes('..')) {
            return { success: false, error: 'Invalid filename' };
        }

        const dir = path.join(app.getPath('downloads'), 'AntigravityOS');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const filePath = path.join(dir, safeName);
        fs.writeFileSync(filePath, data, 'utf8');
        return { success: true, path: filePath };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// ── App Lifecycle ──────────────────────────────────

app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
