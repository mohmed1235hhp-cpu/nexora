export const tauriConfig = {
  build: { distDir: "../dist", devPath: "http://localhost:5173" },
  tauri: { windows: [{ title: "Lovable Desktop", width: 1200, height: 800 }] },
};
