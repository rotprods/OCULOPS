# Excluded Scope

This master pack is designed for OCULOPS execution, not dependency archaeology.

Excluded on purpose:

- `node_modules`
- Python `venv` and `.venv`
- generated runtime export trees
- tracked runtime data directories
- large skill libraries under `AGENCY_OS/EXTENSIONS/Skills`
- generated artifact reports under `agent_factory_v2/04_artifacts`
- workspace repo snapshots under `agent_factory_v2/05_repos`

Reason:

These areas would add volume without improving convergence for the current four-terminal execution cycle.
The repos remain available if a terminal later needs to inspect them.
