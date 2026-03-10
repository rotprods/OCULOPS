# Missing Folder

This folder centralizes the remaining configuration and go-live work for OCULOPS OS.

Files:
- `central-secrets.md`
  Single inventory of the app/deploy/runtime secrets, where each one belongs, what it powers, and whether it is already present remotely.
- `go-live-checklist.md`
  Ordered list of the remaining steps to finish the platform and hand the missing pieces to Codex for live deployment.

How to use this folder:
1. Open `central-secrets.md` to see what is already configured and what is still missing.
2. Follow `go-live-checklist.md` from top to bottom.
3. Once a missing secret is set, tell Codex which item changed and the related feature can be redeployed and smoke tested.
