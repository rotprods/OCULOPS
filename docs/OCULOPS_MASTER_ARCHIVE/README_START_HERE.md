# OCULOPS Master Execution Pack

This is the unified OCULOPS execution workspace for this Mac.

Use this folder as the document control center.
Do not treat it as the implementation source of truth.
Implementation truth still lives in:

- `/Users/rotech/OCULOPS-OS`
- `/Users/rotech/AGENCY_OS`

## What This Folder Contains

- `00_DOWNLOADS_SNAPSHOT`: copied docs from Downloads
- `01_CANONICAL_EXECUTION_PACK`: the curated docs to read first
- `02_REPO_DOCS`: synced repo-doc mirrors for `OCULOPS-OS` and `AGENCY_OS`
- `03_REGISTRIES`: generated and synthetic registry references
- `04_TERMINAL_PROMPTS`: one simple prompt per execution terminal
- `05_EXECUTION_OUTPUTS`: where each terminal writes results
- `06_MANIFESTS`: source maps, scope notes, and counts

## Best Working Method

Yes: one master folder plus four terminals is the best way for this phase.

Why this works:

- the docs are centralized
- the prompts are lane-specific
- the output folders force clean handoffs
- the repos stay canonical for real implementation work

## Launch Order

1. Read `01_CANONICAL_EXECUTION_PACK/07_codex_next_steps.md`
2. Open Terminal 2 first
3. Open Terminals 1, 3, and 4 after Terminal 2 starts publishing runtime truth
4. Keep all lane outputs inside `05_EXECUTION_OUTPUTS`

## Recommended Terminal Working Directories

- Terminal 1: `/Users/rotech/OCULOPS-OS`
- Terminal 2: `/Users/rotech/AGENCY_OS`
- Terminal 3: `/Users/rotech/AGENCY_OS`
- Terminal 4: `/Users/rotech/OCULOPS_MASTER`
