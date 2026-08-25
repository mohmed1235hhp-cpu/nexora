export const electronMain = `
const { app, BrowserWindow } = require("electron");
function createWindow() {
  const win = new BrowserWindow({ width: 1200, height: 800 });
  win.loadURL(process.env.APP_URL || "http://localhost:5173");
}
app.whenReady().then(createWindow);
`;
