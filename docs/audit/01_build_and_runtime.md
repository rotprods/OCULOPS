# OCULOPS OS — Audit: Build & Runtime
**Fecha:** 2026-03-06

---

## Resumen

El pipeline de build funciona correctamente (Vite + electron-builder), pero hay **dos blockers críticos** en la integración Electron que impedirán el funcionamiento de controles de ventana y export de ficheros.

---

## 1. Vite Config

**Fichero:** `vite.config.js`

### ✅ Correcto
- `base: './'` — Necesario para rutas relativas en Electron
- Path aliases (`@`, `@components`, `@hooks`, `@lib`, `@stores`, `@styles`)
- `strictPort: 5173`
- `outDir: 'dist'`

### ❌ Faltante
- Sin code splitting / manualChunks → bundle único de 836 KB
- Sin sourcemaps para debugging en producción
- Sin minificación explícita (confía en defaults de Vite)

**Fix recomendado:**
```javascript
build: {
  outDir: 'dist',
  emptyOutDir: true,
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-router': ['react-router-dom'],
        'vendor-supabase': ['@supabase/supabase-js'],
      }
    }
  }
}
```

---

## 2. Electron — Blocker Crítico: Sistema de Módulos

**Ficheros:** `electron/main.js`, `electron/preload.js`

### 🔴 PROBLEMA: CommonJS en proyecto ES Module

`package.json` declara `"type": "module"`, pero los ficheros Electron usan `require()`:

```javascript
// electron/main.js — ACTUALMENTE (CJS)
const { app, BrowserWindow } = require('electron');
const path = require('path');

// electron/preload.js — ACTUALMENTE (CJS)
const { contextBridge, ipcRenderer } = require('electron');
```

**Impacto:** Puede lanzar error `require is not defined in ES module scope` en Node.js 22+.

**Fix:** Renombrar a `.cjs` o convertir a ES modules con `import`.

---

## 3. Electron — Blocker Crítico: IPC Handlers no implementados

### 🔴 PROBLEMA: Preload expone API que no tiene handlers

`electron/preload.js` expone métodos vía `contextBridge`, pero `electron/main.js` no registra ningún `ipcMain` handler:

| Método preload | IPC event | Handler en main.js |
|---|---|---|
| `minimize()` | `window:minimize` | ❌ No existe |
| `maximize()` | `window:maximize` | ❌ No existe |
| `close()` | `window:close` | ❌ No existe |
| `showNotification()` | `notification:show` | ❌ No existe |
| `saveFile()` | `file:save` | ❌ No existe |

**Fix necesario en `electron/main.js`:**
```javascript
import { ipcMain } from 'electron';

ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize();
});
ipcMain.on('window:close', () => mainWindow?.close());
ipcMain.on('notification:show', (event, { title, body }) => {
  new Notification({ title, body }).show();
});
ipcMain.handle('file:save', async (event, { data, filename }) => {
  const { dialog } = await import('electron');
  const { filePath } = await dialog.showSaveDialog({ defaultPath: filename });
  if (filePath) {
    const { writeFile } = await import('fs/promises');
    await writeFile(filePath, data, 'utf8');
    return { success: true, path: filePath };
  }
  return { success: false };
});
```

---

## 4. App.jsx — Sin lazy loading

Todos los 21 módulos se importan estáticamente en el bundle inicial:

```jsx
// ACTUAL — todo bundleado junto
import ControlTower from './components/modules/ControlTower'
import Execution from './components/modules/Execution'
// ... 19 más
```

**Impacto:** Bundle inicial ~836 KB. Con lazy loading estimado ~300-400 KB.

**Fix:**
```jsx
const ControlTower = lazy(() => import('./components/modules/ControlTower'));
const Execution = lazy(() => import('./components/modules/Execution'));

// En el router:
<Suspense fallback={<div className="loading">Cargando...</div>}>
  <Routes>...</Routes>
</Suspense>
```

---

## 5. Dependencias

### Paquetes no usados (eliminar)

| Paquete | Tamaño estimado | Uso encontrado |
|---------|----------------|----------------|
| `reactflow` | ~80 KB | ❌ No hay imports |
| `@dnd-kit/core` | ~40 KB | ❌ No hay imports |
| `@dnd-kit/sortable` | ~25 KB | ❌ No hay imports |

```bash
npm uninstall reactflow @dnd-kit/core @dnd-kit/sortable
```

### @types sin usar (en devDeps)

`@types/react` y `@types/react-dom` instalados pero sin TypeScript configurado.
Mantener si se planea migración TS, sino eliminar.

### Versiones (todas actualizadas ✅)

React 19.2, Vite 7.3, Electron 35.1, Zustand 5.0, react-router-dom 7.6 — stack muy moderno.

---

## 6. Scripts npm

| Script | Estado | Nota |
|--------|--------|------|
| `dev` | ✅ | Vite dev server :5173 |
| `build` | ✅ | Output → dist/ |
| `lint` | ✅ | ESLint 9 flat config |
| `preview` | ✅ | Vite preview |
| `electron:dev` | ⚠️ | Puede fallar por falta de IPC handlers |
| `electron:build` | ✅ | Genera .dmg |
| `electron:preview` | ✅ | Build + lanzar Electron |

**Faltante:** `"engines": { "node": ">=18.0.0" }` en package.json.

---

## 7. ESLint

`eslint.config.js` usa flat config (ESLint 9) con React Hooks plugin. Mínimo funcional pero faltan reglas:

```javascript
rules: {
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'react-hooks/exhaustive-deps': 'warn',
  'prefer-const': 'error',
}
```

---

## 8. Build output

- **dist/ size actual:** 836 KB total
- **Con lazy loading + code splitting:** ~350-450 KB inicial
- **Build time:** Rápido (Vite 7)
- **Plataformas configuradas:** Solo macOS (.dmg). Sin Windows/Linux config.

---

## Prioridad de fixes

| Fix | Severidad | Tiempo estimado |
|-----|-----------|----------------|
| IPC handlers en main.js | 🔴 P0 | 1 hora |
| CJS → ESM en electron/ | 🔴 P0 | 30 min |
| Lazy loading módulos | 🟠 P1 | 2 horas |
| Eliminar deps no usadas | 🟡 P2 | 15 min |
| Vite code splitting config | 🟡 P2 | 30 min |
| `engines` en package.json | 🟢 P3 | 5 min |
