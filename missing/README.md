# Missing Folder

This folder centralizes the remaining configuration and go-live work for ANTIGRAVITY OS.

Files:
- `central-secrets.md`
  Single inventory of the app/deploy/runtime secrets, where each one belongs, what it powers, and whether it is already present remotely.
- `secrets-template.env`
  Fill-in template with the relevant variables grouped by platform.
- `go-live-checklist.md`
  Ordered list of the remaining steps to finish the platform and hand the missing pieces to Codex for live deployment.

How to use this folder:
1. Open `central-secrets.md` to see what is already configured and what is still missing.
2. Fill `secrets-template.env` outside git, or use it as a checklist while setting Vercel and Supabase secrets.
3. Follow `go-live-checklist.md` from top to bottom.
4. Once a missing secret is set, tell Codex which item changed and the related feature can be redeployed and smoke tested.
