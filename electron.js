const { app, BrowserWindow } = require('electron');
const path = require('path');

// 判断是否为开发环境
const isDev = !app.isPackaged;

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    if (isDev) {
        // 开发环境下，加载 Vite 开发服务器的 URL
        win.loadURL('http://localhost:3000');
        // 自动打开开发者工具
        win.webContents.openDevTools();
    } else {
        // 生产环境下，加载打包后的 index.html
        win.loadFile(path.join(__dirname, 'dist/index.html'));
        // 如果需要，在生产环境中也可以打开开发者工具进行调试
        // win.webContents.openDevTools();
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
