# ANTIGRAVITY OS — Audit: Seguridad & Configuración
**Fecha:** 2026-03-06

---

## Resumen

Base de seguridad sólida (RLS en todas las tablas, Electron sandboxed, credenciales en .env). Sin embargo, hay **3 hallazgos críticos** que requieren acción inmediata.

**Riesgo global: MEDIO** (con items ALTO que requieren acción en < 24h)

---

## 1. Hallazgos Críticos 🔴

### C1: `.env.backup` no está en `.gitignore`

**Fichero:** `.gitignore`
**Problema:** El `.gitignore` protege `.env*` pero `.env.backup` existe y puede haber sido commiteado.

```bash
# .gitignore actual:
.env*      ← ¿Cubre .env.backup? Depende de la versión de git

# Verificar:
git log --all --full-history -- .env.backup
```

**Acción inmediata:**
```bash
git rm --cached .env.backup 2>/dev/null || true
echo ".env.backup" >> .gitignore
git add .gitignore
git commit -m "fix(security): exclude .env.backup from tracking"
```

Si el fichero ya fue commiteado históricamente, rotar el Supabase anon key.

---

### C2: Edge Functions sin autenticación

**`api-proxy`** y **`daily-snapshot`** son accesibles sin verificar identidad del usuario:

```typescript
// supabase/functions/api-proxy/index.ts
Deno.serve(async (req: Request) => {
  // ❌ NO hay verificación de auth antes de procesar
  const { connector_id, endpoint, method, params } = await req.json();

  // Cualquiera puede llamar a cualquier conector
  const { data: connector } = await supabase
    .from('api_connectors')
    .select('*')
    .eq('id', connector_id)  // Sin verificar que pertenece al usuario
    .single();
```

```typescript
// supabase/functions/daily-snapshot/index.ts
Deno.serve(async (req: Request) => {
  // ❌ Procesa TODOS los perfiles sin autenticación
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id');
```

**Fix para api-proxy:**
```typescript
import { createClient } from '@supabase/supabase-js';

const authHeader = req.headers.get('Authorization');
if (!authHeader) return new Response('Unauthorized', { status: 401 });

const supabaseUser = createClient(url, anonKey, {
  global: { headers: { Authorization: authHeader } }
});
const { data: { user } } = await supabaseUser.auth.getUser();
if (!user) return new Response('Unauthorized', { status: 401 });
```

**Fix para daily-snapshot:** Eliminar como endpoint HTTP, convertir a pg_cron scheduled job.

---

### C3: API keys almacenadas sin cifrar en columnas JSONB

Las tablas `messaging_channels` y `api_connectors` almacenan credenciales en plain text:

```sql
-- messaging_channels.config (JSONB sin cifrar):
{ "api_key": "Bearer xyz...", "access_token": "...", "webhook_secret": "..." }

-- api_connectors.auth_config (JSONB sin cifrar):
{ "token": "...", "username": "admin", "password": "..." }
```

**Fix:** Usar Supabase Vault para cifrar estos campos:
```sql
-- Activar Vault extension en Supabase dashboard
-- Luego usar vault.create_secret() / vault.decrypted_secrets
```

---

## 2. Hallazgos de Riesgo Alto 🟠

### A1: Tabla `conversations` sin `user_id`

El schema SQL no incluye `user_id` en `conversations`, lo que impide que RLS filtre por usuario:

```sql
-- ACTUAL (sin user_id):
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id),
  channel_id UUID REFERENCES messaging_channels(id),
  -- ...
);

-- FIX:
ALTER TABLE conversations ADD COLUMN user_id UUID REFERENCES profiles(id) NOT NULL;
CREATE POLICY "own_conversations" ON conversations
  FOR ALL USING (user_id = auth.uid());
```

### A2: Electron `saveFile` sin validación de path

```javascript
// electron/preload.js — ACTUAL
saveFile: (data, filename) => ipcRenderer.invoke('file:save', { data, filename }),
// filename puede ser "../../../etc/passwd" o similar
```

**Fix en el handler de main.js:**
```javascript
ipcMain.handle('file:save', async (event, { data, filename }) => {
  const safeName = path.basename(filename); // elimina path traversal
  if (!safeName || safeName.includes('..')) throw new Error('Invalid filename');
  const dir = path.join(app.getPath('downloads'), 'AntigravityOS');
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(path.join(dir, safeName), data, 'utf8');
  return { success: true };
});
```

### A3: WhatsApp webhook sin verificación de firma

```typescript
// supabase/functions/whatsapp-webhook/index.ts
// Solo verifica token de texto plano, no valida X-Hub-Signature-256
if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
  return new Response(challenge);
}
// ❌ No hay crypto.subtle.verify(signature)
```

---

## 3. Hallazgos de Riesgo Medio 🟡

### M1: CORS headers faltantes en Edge Functions

Las funciones no devuelven headers CORS, causando errores si se llaman desde web:
```typescript
// Agregar a todas las Edge Functions:
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
```

### M2: Electron sin hardening adicional

```javascript
// Agregar a electron/main.js:
mainWindow.webContents.setWindowOpenHandler(({ url }) => {
  if (url.startsWith('https://')) {
    shell.openExternal(url);
  }
  return { action: 'deny' };
});
```

### M3: Error messages exponen detalles de API

```typescript
// ACTUAL — expone error de Google Maps:
return new Response(JSON.stringify({
  error: searchData.status,
  details: searchData.error_message
}));

// FIX — log interno, mensaje genérico:
console.error('Maps API error:', searchData);
return new Response(JSON.stringify({ error: 'Search failed' }), { status: 400 });
```

---

## 4. Supabase Schema — Estado RLS

**Todas las 28 tablas tienen RLS habilitado** ✅

| Categoría | Tablas | RLS | user_id |
|-----------|--------|-----|---------|
| Auth | profiles | ✅ | ✅ |
| CRM | companies, contacts, deals, crm_activities | ✅ | ✅ |
| Inteligencia | signals, decisions, experiments, opportunities | ✅ | ✅ |
| Conocimiento | knowledge_entries, tasks | ✅ | ✅ |
| Negocio | niches, bets, pipeline_entries | ✅ | ✅ |
| Finanzas | finance_entries | ✅ | ✅ |
| Alertas | alerts | ✅ | ✅ |
| Mensajería | messaging_channels, conversations, messages | ✅ | ⚠️ conversations sin user_id |
| Leads | detected_leads, detection_rules | ✅ | ✅ |
| Automation | automation_workflows, automation_runs, api_connectors | ✅ | ✅ |
| Marketing | campaigns, campaign_metrics | ✅ | ✅ |
| Recursos | resource_allocations | ✅ | ✅ |
| Snapshots | daily_snapshots | ✅ | ✅ |

**Índices:** ✅ Correctamente definidos en foreign keys y columnas de filtrado frecuente.

---

## 5. Variables de entorno

| Variable | Tipo | Exposición | Estado |
|----------|------|-----------|--------|
| VITE_SUPABASE_URL | Pública | Frontend (VITE_) | ✅ Correcto |
| VITE_SUPABASE_ANON_KEY | Pública JWT | Frontend (VITE_) | ✅ Correcto (anon key es segura) |
| GOOGLE_MAPS_API_KEY | Privada | Solo Edge Functions | ✅ Correcto |
| META_APP_SECRET | Privada | Solo Edge Functions | ✅ Correcto |
| OPENAI_API_KEY | Privada | Solo Edge Functions | ✅ Correcto |
| ANTHROPIC_API_KEY | Privada | Solo Edge Functions | ✅ Correcto |
| WHATSAPP_TOKEN | Privada | Solo Edge Functions | ✅ Correcto |

**Total:** 2 públicas + 13 privadas. Separación correcta.

---

## 6. Seguridad Electron

| Configuración | Estado |
|---------------|--------|
| `contextIsolation: true` | ✅ |
| `nodeIntegration: false` | ✅ |
| Preload script con contextBridge | ✅ |
| DevTools solo en dev | ✅ |
| `enableRemoteModule: false` | ❌ No explícito |
| `sandbox: true` | ❌ No configurado |
| CSP headers | ❌ No definidos |

---

## 7. Plan de remediación

| # | Acción | Severidad | Tiempo | Urgencia |
|---|--------|-----------|--------|----------|
| 1 | Verificar/eliminar .env.backup del historial git | 🔴 Crítico | 15 min | Hoy |
| 2 | Agregar auth a api-proxy edge function | 🔴 Crítico | 1h | Esta semana |
| 3 | Convertir daily-snapshot a scheduled job | 🔴 Crítico | 2h | Esta semana |
| 4 | Agregar user_id a conversations + migración | 🟠 Alto | 1h | Esta semana |
| 5 | Validar path en saveFile IPC handler | 🟠 Alto | 30min | Esta semana |
| 6 | Activar Supabase Vault para JSONB credentials | 🟠 Alto | 2h | Próximas 2 semanas |
| 7 | Firma WhatsApp webhook | 🟠 Alto | 1h | Próximas 2 semanas |
| 8 | CORS headers en Edge Functions | 🟡 Medio | 30min | Próximas 2 semanas |
| 9 | Hardening adicional Electron | 🟡 Medio | 1h | Próximo mes |
| 10 | Logs de error internos (no exponer a cliente) | 🟡 Medio | 2h | Próximo mes |
