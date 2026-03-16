# Terminal 4 - Definitive Plan Prerequisites

Generated: 2026-03-15
Refreshed after cross-terminal closure: 2026-03-15

**FACT**
- Terminal 1, Terminal 2, Terminal 3, and Terminal 4 have now all published formal output files in `05_EXECUTION_OUTPUTS`.
- Terminal 2's corrected runtime manifest shows the real runtime boundary:
  - executable ownership is mainly in `/Users/rotech/AGENCY_OS`
  - several live PM2 scripts run from `/Users/rotech/OCULOPS-OS/AIOPS`
  - out-of-tree runtime code still lives in `/Users/rotech/Downloads/rr`
- No registry file in `03_REGISTRIES` is currently safe to treat as the canonical pack.
- Model routing is hybrid with local-first preference, not uniformly local-first.
- Agent Zero is running, but a governed caller path is not yet proven.
- Qdrant live truth is 7 collections, while current docs and generated registries still describe 3.
- Terminal 3 has now closed the automation and exposure posture: native `n8n :5680` is canonical, Docker `n8n :5678` is non-core, gateway `:38793` is the only justified broker, and public exposure is `NO-GO`.

## Prerequisite Gates

1. Approve one runtime ownership map.
Current blocker: the corrected manifest exists, but the system still runs from mixed roots (`AGENCY_OS`, `/Users/rotech/OCULOPS-OS/AIOPS`, and `/Users/rotech/Downloads/rr`). The definitive plan needs one declared core owner and one migration rule for the other two roots.

2. Adopt one governor naming map.
Current blocker: Terminal 4 has recommended `CloudBot Governor` as the role, `ClawBot` as the live implementation label, and `OpenClaw` as the runtime framework, but that map is not yet enforced across docs and repo claims.

3. Approve one canonical registry pack.
Current blocker: the generated pack conflicts with live runtime truth and the synthetic pack is illustrative only.

4. Freeze the current routing policy label.
Current blocker: the system is operating as `hybrid with local-first preference`, but several docs still imply local-first as if it were already enforced system-wide.

5. Resolve Agent Zero's role.
Current blocker: Agent Zero is live on `:50080`, but there is no approved governed caller path that makes it part of the core execution chain.

6. Reconcile memory taxonomy.
Current blocker: live memory health exposes 7 Qdrant collections, while the documented registry posture still describes 3 collections and a narrower memory model.

7. Split operational workflows from imported and community workflows.
Current blocker: the current workflow registry mixes 2,075 community or imported workflows with 44 active flows, which is unusable for a definitive operating plan.

8. Split governed tools from raw node catalogs.
Current blocker: the current tool registry is a raw n8n node inventory, not a governed OCULOPS capability registry.

9. Collapse the cross-terminal outputs into one implementation pack.
Current blocker: the audits are now aligned, but they still live as four parallel output sets plus a shared handoff board. The next artifact must be one definitive implementation plan.

10. Dedupe runtime support surfaces and unsafe ingress.
Current blocker: live PM2 still includes duplicate `readiness-sync` entries, duplicate `automejora` naming, parallel tunnel surfaces, and unauthenticated protected gateway routes.

**INFERENCE**
- The definitive plan should start from identity, registry, runtime, and routing convergence, not from feature ambition.
- The remaining prerequisites are mostly authority and hardening problems, not software-absence problems.

**RISK**
- Starting the definitive plan before these gates are closed will hard-code the wrong pack, wrong governor name, wrong runtime boundary, and wrong ingress posture.
- That would make later convergence look like regression even when it is actually correction.

**REQUIRED ACTION**
- Use the corrected Terminal 2 manifest, the closed Terminal 3 exposure posture, and Terminal 1's caller inventory as the fixed base for the definitive plan.
- Lock the governor naming map and registry truth source map before any implementation sequencing is written.
- Rebuild the workflow, tool, service, agent, and memory registries from audited live truth.
- Carry Agent Zero as `non-core` unless or until a governed caller path is validated.
