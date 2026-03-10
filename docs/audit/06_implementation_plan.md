# OCULOPS OS — Plan de Implementación Post-Auditoría
**Fecha:** 2026-03-06 | Basado en auditoría completa v10.0.0

---

## Resumen ejecutivo

**Estado actual:** La app tiene migración 100% completa, arquitectura sólida y diseño premium. Tiene **4 blockers P0** que impiden el uso correcto en Electron, y **5 issues P1** de seguridad que deben resolverse antes de producción.

---

## P0 — Blockers (resolver en 1-2 días)

### P0.1 — IPC Handlers en Electron
**Problema:** Los controles de ventana y file export no funcionan (handlers no implementados).
**Fichero:** `electron/main.js`
**Acción:**
```javascript
import { ipcMain, Notification } from 'electron';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Al final de app.whenReady():
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize();
});
ipcMain.on('window:close', () => mainWindow?.close());
ipcMain.on('notification:show', (_, { title, body }) => {
  new Notification({ title, body }).show();
});
ipcMain.handle('file:save', async (_, { data, filename }) => {
  const safeName = path.basename(filename);
  if (!safeName || safeName.includes('..')) throw new Error('Invalid filename');
  const dir = path.join(app.getPath('downloads'), 'OculopsOS');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), data, 'utf8');
  return { success: true, path: path.join(dir, safeName) };
});
```

### P0.2 — CJS → ESM en electron/
**Problema:** `main.js` y `preload.js` usan `require()` pero el proyecto es `"type": "module"`.
**Acción:** Renombrar a `main.cjs` y `preload.cjs`, o convertir a ES modules con `import`.
Opción más simple:
```bash
# Renombrar y actualizar referencias en package.json
mv electron/main.js electron/main.cjs
mv electron/preload.js electron/preload.cjs
```
Actualizar `package.json`:
```json
"electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron electron/main.cjs\"",
"electron:preview": "vite build && electron electron/main.cjs"
```
Actualizar `vite.config.js`:
```javascript
build: {
  rollupOptions: {
    input: { main: 'index.html' }
  }
}
```
Y en `main.cjs` cambiar la referencia a preload:
```javascript
preload: path.join(__dirname, 'preload.cjs')
```

### P0.3 — Error Boundary
**Problema:** Cualquier error en render crashea toda la app.
**Acción:** Crear `src/components/ui/ErrorBoundary.jsx`:
```jsx
import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('Module error:', error, info.componentStack); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <h3 className="text-secondary">Error en este módulo</h3>
          <p className="text-tertiary text-sm">{this.state.error?.message}</p>
          <button className="btn btn-ghost mt-4" onClick={() => this.setState({ hasError: false })}>
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```
Usar en `src/components/layout/Layout.jsx`:
```jsx
import { ErrorBoundary } from '../ui/ErrorBoundary';
// ...
<main className="content-area">
  <ErrorBoundary>
    <Outlet />
  </ErrorBoundary>
</main>
```

### P0.4 — Seguridad: .env.backup
**Problema:** `.env.backup` puede contener credenciales y no está excluido correctamente.
**Acción:**
```bash
git rm --cached .env.backup 2>/dev/null || true
echo "" >> .gitignore
echo "# Backups de env" >> .gitignore
echo ".env.backup" >> .gitignore
echo ".env.*.backup" >> .gitignore
git add .gitignore
# Verificar si fue commiteado antes:
git log --all --full-history -- .env.backup
```
Si aparece en historial → rotar Supabase anon key en el dashboard.

---

## P1 — Seguridad (resolver en 1 semana)

### P1.1 — Auth en Edge Functions
Agregar verificación de usuario en `api-proxy` y `daily-snapshot`.
Ver detalles en `04_security.md` sección C2.

### P1.2 — `user_id` en tabla `conversations`
```sql
ALTER TABLE conversations
  ADD COLUMN user_id UUID REFERENCES profiles(id);

-- Rellenar con datos existentes si los hay
-- UPDATE conversations SET user_id = ... WHERE ...

ALTER TABLE conversations ALTER COLUMN user_id SET NOT NULL;

CREATE POLICY "own_conversations" ON conversations
  FOR ALL USING (user_id = auth.uid());
```

### P1.3 — CORS headers en todas las Edge Functions
Añadir al inicio de cada función:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders });
}
```

### P1.4 — Validación path en saveFile IPC
Ver P0.1 — ya incluido en el fix del handler `file:save`.

### P1.5 — Firma webhook WhatsApp
```typescript
// supabase/functions/whatsapp-webhook/index.ts
async function verifySignature(body: string, signature: string): Promise<boolean> {
  const secret = Deno.env.get('WHATSAPP_APP_SECRET') || '';
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  );
  const sigBytes = hexToBytes(signature.replace('sha256=', ''));
  return crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(body));
}
```

---

## P2 — Performance (resolver en 2-3 semanas)

### P2.1 — Lazy loading de módulos
```jsx
// src/App.jsx
import { lazy, Suspense } from 'react';

const ControlTower = lazy(() => import('./components/modules/ControlTower'));
const Execution = lazy(() => import('./components/modules/Execution'));
// ... 19 más

// Envolver Routes:
<Suspense fallback={<div className="loading-screen">Cargando...</div>}>
  <Routes>...</Routes>
</Suspense>
```
**Impacto esperado:** Bundle inicial ~836 KB → ~350 KB.

### P2.2 — Eliminar dependencias no usadas
```bash
npm uninstall reactflow @dnd-kit/core @dnd-kit/sortable
# Si no se planea usar TypeScript:
# npm uninstall --save-dev @types/react @types/react-dom
```

### P2.3 — CEO Score en utilidad compartida
```javascript
// src/lib/ceoScore.js
export function ceoScore({ impact, velocity, scalability, confidence, risk, resourceCost }) {
  if (risk === 0 || resourceCost === 0) return 0;
  return (
    Math.pow(impact, 1.2) * Math.pow(velocity, 1.5) *
    Math.pow(scalability, 0.5) * confidence
  ) / (risk * resourceCost);
}
```
Eliminar duplicado de `useAppStore.js` y `useNiches.js`.

### P2.4 — Cifrado columnas JSONB (Supabase Vault)
Activar en Supabase dashboard → activar extensión `vault` → migrar `messaging_channels.config` y `api_connectors.auth_config`.

---

## P3 — Calidad (roadmap v11)

### P3.1 — Vitest + React Testing Library
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```
Empezar con tests de:
- `src/lib/ceoScore.js` (algoritmo crítico)
- `src/lib/simulation.js` (modelo financiero)
- `src/hooks/useAuth.js` (auth flow)

### P3.2 — TypeScript gradual
```bash
npm install -D typescript
# Crear tsconfig.json
# Migrar primero: src/lib/*.js → src/lib/*.ts
# Luego: src/hooks/ → .ts
# Luego: src/components/ → .tsx
```

### P3.3 — Vite code splitting config
```javascript
// vite.config.js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-router': ['react-router-dom'],
        'vendor-supabase': ['@supabase/supabase-js'],
        'vendor-maps': ['leaflet'],
      }
    }
  }
}
```

### P3.4 — Z-index cleanup
Agregar a `tokens.css`:
```css
--z-notification: 550;  /* entre toast (500) y command (600) */
```
Actualizar `NotificationCenter.css` para usar `var(--z-notification)` en lugar de `10000`.

### P3.5 — Sincronización Supabase
Actualmente el store usa solo localStorage. Plan de migración:
1. Activar Supabase (configurar `.env`)
2. Usar hooks existentes (`useLeads`, `useContacts`, etc.) que ya tienen RealTime
3. Migrar datos de localStorage → Supabase via script de migración
4. Desactivar localStorage persist del store para datos de negocio

---

## Checklist de producción

Antes de considerar la app lista para uso diario:

- [ ] P0.1 IPC handlers implementados
- [ ] P0.2 CJS/ESM resuelto
- [ ] P0.3 Error Boundary añadido
- [ ] P0.4 .env.backup excluido del repo
- [ ] P1.1 Auth en Edge Functions críticas
- [ ] P1.2 user_id en conversations
- [ ] Supabase .env configurado (o DEV_MODE aceptado conscientemente)
- [ ] Al menos 1 prueba de exportar fichero
- [ ] Al menos 1 prueba de autenticación Supabase

---

## Estimación de esfuerzo total

| Prioridad | Items | Tiempo estimado |
|-----------|-------|----------------|
| P0 | 4 items | 4-6 horas |
| P1 | 5 items | 6-8 horas |
| P2 | 4 items | 4-5 horas |
| P3 | 5 items | 8-12 horas |
| **Total** | **18 items** | **~22-31 horas** |
