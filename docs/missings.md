# OCULOPS — Missings (pendientes no bloqueantes)

## Email
- [ ] `RESEND_API_KEY` — configurar en Supabase secrets (`npx supabase secrets set RESEND_API_KEY=re_xxx --linked`)
- [ ] Verificar dominio `oculops.com` en Resend (o usar sandbox para testing)
- [ ] Welcome email trigger (`trigger_welcome_email`) ya está en DB, solo falta la API key para que funcione
- [ ] `FROM_EMAIL` env opcional — default: `OCULOPS <noreply@oculops.com>`
