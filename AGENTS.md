# Agent Entry Protocol

## First Read (Mandatory)

Before making any code change, every agent must read:

1. `ops/control-tower.md`
2. `ops/workstreams.json`

If they conflict with older docs, treat `ops/control-tower.md` as the operational snapshot and `ops/workstreams.json` as the assignment source.

## Workstream Discipline

- Claim work by updating `ops/workstreams.json` (`owner`, `status`, `next_action`, `updated_at`).
- Do not start a stream already marked as `active` by another owner unless explicitly coordinated.
- Regenerate control tower after changing assignments or finishing major tasks:
  - `npm run control-tower:update`

## Merge Safety

- Keep branch ownership clear in workstreams before opening PRs.
- Use small commits tied to one workstream when possible.
- If a blocker appears, write it into `ops/workstreams.json` and regenerate the control tower.
