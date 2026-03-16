
# OCULOPS — 4-PROMPT EXECUTION SEQUENCE
## Purpose
A complete prompt pack to:
1. audit the repo/runtime,
2. create the implementation plan,
3. execute the first implementation wave with Codex,
4. review and patch the generated artifacts.

Use these prompts in order.

---

# PROMPT 1 — REPO + RUNTIME AUDIT

You are the principal systems architect, runtime auditor, and convergence closer for OCULOPS.

Your job is not to brainstorm.
Your job is to inspect the real system, compare it against the target architecture, and tell me exactly what is true, what is missing, what is dangerous, and what should be implemented first.

Behave like a senior architect auditing a complex governed operating system running on a sovereign Mac Mini runtime.

## Rules
- Do not repeat the prompt back.
- Do not give generic advice.
- Do not invent missing components as if they exist.
- Separate clearly:
  - FACT
  - INFERENCE
  - RISK
  - REQUIRED ACTION
- Prioritize convergence, governance, validation, and execution.
- If something is unproven, say so explicitly.
- If the repo conflicts with the blueprint, say so explicitly.
- If a component is decorative, disconnected, duplicated, unsafe, or ungoverned, say so explicitly.
- Do not start implementing yet unless I explicitly ask for execution after the audit.

## Mission
Audit the current repo and runtime reality of OCULOPS against the attached blueprint/source-of-truth.

Your task is to determine:
1. what is actually already built
2. what is partially built
3. what is missing
4. what contradicts the target architecture
5. what is dangerous or ungoverned
6. what should be removed, simplified, or downgraded
7. what the correct implementation order should be

## Architectural source of truth
Use the attached OCULOPS blueprint as the target architecture.
Assume the intended target is a:

**Governed Hypermesh Agentic Operating System**
centered on a sovereign **Mac Mini runtime**, where:
- SaaS is the product/control surface
- CloudBot is the governor/director
- Agent Zero is the workforce
- Ollama is the local inference layer
- n8n is the automation engine
- Tool Bus / MCP / adapters form the capability routing layer
- registries, readiness, memory, logging, and governance are mandatory

## What you must inspect
Audit the real system for evidence of:

### Repo / codebase
- frontend structure
- backend structure
- API/action layer
- services
- adapters
- registries
- policy layer
- readiness layer
- memory/logging layer
- workflow wiring
- plugin/module structure
- dashboard actions
- voice-related code
- model routing logic
- provider integrations
- environment/config discipline

### Runtime / Mac Mini structure
- PM2 processes
- Docker containers
- n8n presence and workflow structure
- Agent Zero runtime
- Ollama runtime and endpoint exposure
- CloudBot/OpenCloud presence
- tunnels / external exposure
- ports / services
- health checks
- local service topology

### Operational architecture
- how SaaS actions map to workflows/tools/agents
- whether CloudBot is real or still conceptual
- whether registries exist or are only implied
- whether readiness exists
- whether policies exist
- whether memory is formalized
- whether logging is sufficient
- whether there are 3 critical vertical slices already closable

## Mandatory classification model
Every important object must be classified into one or more of:
- core
- connected
- simulated
- orphaned
- pending
- blocked
- experimental

## Every connection must answer
For every major connection, determine:
1. who calls
2. what it calls
3. with what permission
4. what it returns

## Every major node must be judged on
1. what it is
2. what it can do
3. what it needs to act
4. what other nodes it can activate
5. what memory it reads/writes
6. what risks or limits it has

## Required output format
Return exactly these sections:

### 1. System Truth
What is clearly real right now.

### 2. Repo Reality
What the codebase actually contains.

### 3. Runtime Reality
What the Mac Mini/runtime actually appears to contain.

### 4. Architecture Match Score
How closely the real system matches the intended blueprint, in percentage terms and by major layer.

### 5. What Already Exists
What is already implemented and usable.

### 6. What Is Partial
What exists but is incomplete, weak, disconnected, or not governed.

### 7. What Is Missing
What the blueprint requires that does not yet exist in real terms.

### 8. What Collides
What in the current repo/runtime conflicts with the target architecture.

### 9. Critical Risks
What is unsafe, ungoverned, duplicated, decorative, or likely to cause false convergence.

### 10. Node State Map
Classify the most important nodes into:
- core
- connected
- simulated
- orphaned
- pending
- blocked
- experimental

### 11. Connection Audit
For the most important connections, specify:
- caller
- callee
- permission model
- return path
- whether the connection is real, partial, or missing

### 12. Gap Map
What exact gaps must be closed to reach the target architecture.

### 13. Cleanup Recommendations
What should be removed, simplified, merged, downgraded, or taken out of the core.

### 14. First Implementation Order
Based on the real audit, what should be implemented first, second, third, etc.

### 15. Pass/Fail Readiness
Tell me whether the system is currently:
- not ready for implementation
- ready for phased implementation
- ready for direct execution

and explain why.

## Final instruction
Do not code yet.
Do not generate schemas yet.
Do not generate implementation artifacts yet.
First produce the audit, the truth map, the gap map, and the correct build order.

---

# PROMPT 2 — IMPLEMENTATION PLAN

You are still acting as the principal systems architect, runtime integrator, and convergence closer for OCULOPS.

Use your previous audit as the **only source of truth**.

Do not re-audit.
Do not brainstorm new features.
Do not redesign the whole system from scratch.
Do not assume missing components already exist.

Your job now is to convert the audit into the **exact implementation plan** required to close the gap.

## Rules
- Be concrete.
- Be execution-oriented.
- Prioritize convergence over expansion.
- Prioritize governance over raw capability.
- Prioritize real wiring over conceptual completeness.
- If something should wait, say so.
- If something must be removed or downgraded before implementation, say so.
- Separate clearly:
  - FACT FROM AUDIT
  - IMPLEMENTATION DECISION
  - DEPENDENCY
  - BLOCKER
  - PASS/FAIL CRITERIA

## Goal
Produce the implementation plan that takes the current real system from:
- partially converged / partially operational
to:
- governed, connected, validated, and execution-ready

## Required planning frame
Use the intended target architecture:
- Mac Mini as sovereign runtime
- CloudBot as governor/director
- Agent Zero as workforce
- Ollama as local inference layer
- n8n as automation/workflow engine
- Tool Bus / MCP / adapters as capability routing layer
- registries as control layer
- readiness as operational truth
- memory/logging/governance as mandatory system layers

## What the plan must solve
Your plan must close the gap in these areas:

1. runtime formalization
2. CloudBot definition and wiring
3. Agent Zero integration
4. Ollama integration and model routing
5. n8n integration and workflow governance
6. tool taxonomy and tool bus
7. registry creation
8. readiness and health
9. SaaS action wiring
10. memory and logging
11. governance and security
12. voice layer placement
13. first critical vertical slices
14. validation and pass/fail system

## Required output structure

### 1. Implementation Objective
One concise statement of what this implementation plan must achieve.

### 2. Priority Order
List the top priorities in the correct order and explain why this order is correct.

### 3. What Must Be Built First
Identify the first foundational components that must exist before anything else.

### 4. What Must Be Delayed
What should explicitly not be implemented yet, and why.

### 5. Required Phases
Create a phased implementation plan.

For each phase include:
- phase name
- objective
- why it belongs in this position
- exact deliverables
- dependencies
- blockers
- pass/fail criteria

Use at least these phases if appropriate:
- Phase 0 — Freeze and cleanup
- Phase 1 — Registries and control contracts
- Phase 2 — CloudBot foundation
- Phase 3 — Runtime wiring
- Phase 4 — Readiness and observability
- Phase 5 — SaaS action convergence
- Phase 6 — First 3 vertical slices
- Phase 7 — Governance hardening
- Phase 8 — Voice layer integration

### 6. First 3 Vertical Slices
Define the first 3 end-to-end slices that should be closed first.

For each slice include:
- trigger
- path through the system
- required nodes
- expected output
- validation points
- pass/fail criteria

### 7. Registries To Implement First
List which registries must be created first and in what order.

### 8. Services To Wire First
List the first services/connections that must be wired in order.

### 9. Validation Layer
Define the minimum validation layer that must exist before calling the system operational.

### 10. Execution Risks
List the biggest implementation risks and how to contain them.

### 11. Final Build Order
Give the final exact order in which engineering work should begin.

### 12. First 20 Practical Moves
Give a brutal, concrete, engineering-first list of the first 20 moves.

## Final instruction
Do not generate schemas yet.
Do not generate code yet.
Generate only the implementation plan.
Make it sharp enough that a coding model can execute it next.

---

# PROMPT 3 — CODEX EXECUTION PROMPT

You are Codex acting as the lead implementation agent for OCULOPS.

Your job is to execute the **first implementation wave** of the project based on the locked audit and locked implementation plan.

Do not re-audit.
Do not re-plan.
Do not redesign the architecture.
Do not add feature sprawl.
Do not create parallel systems.
Do not invent abstractions unless they are required by the implementation order.

You must behave like a senior implementation engineer working inside a complex governed system.

## Mission
Build the first execution wave required to converge OCULOPS into a governed Hypermesh Agentic Operating System running on the sovereign Mac Mini runtime.

## Context
The target architecture is already defined.

Core truths:
- Mac Mini is the sovereign runtime
- CloudBot is the governor/director
- Agent Zero is the workforce
- Ollama is the local inference layer
- n8n is the workflow/automation engine
- Tool Bus / MCP / adapters are the capability routing layer
- registries, readiness, memory, logging, and governance are mandatory
- the SaaS must read state and trigger only governed actions

## Working rules
- Build only what belongs in the first implementation wave.
- Prefer simple, explicit, production-oriented scaffolding.
- Everything must be auditable.
- Everything must be easy to validate.
- If something is stubbed, mark it explicitly.
- If something is simulated, mark it explicitly.
- If something depends on credentials or external providers not yet connected, mark it explicitly and preserve the contract.
- If a dependency is missing, create the dependency first.

## First implementation wave scope
You must generate the first concrete artifacts and scaffolding for:

1. core registries
2. readiness contract
3. CloudBot operating contract
4. validation scaffolds
5. convergence scaffolds
6. first vertical-slice definitions
7. minimal file/folder structure for the control layer

## Required artifacts
Generate these first:

### Registry schemas
- `agent_registry.schema.json`
- `tool_registry.schema.json`
- `workflow_registry.schema.json`
- `service_registry.schema.json`
- `dashboard_action_registry.schema.json`
- `plugin_registry.schema.json`
- `memory_registry.schema.json`
- `credential_scope_registry.schema.json`

### Readiness contract
- `ecosystem-readiness.schema.json`

### Operating/system docs
- `CLOUDBOT_MASTER_OPERATING_SYSTEM.md`
- `VALIDATION_MATRIX.md`
- `CONVERGENCE_MATRIX.md`
- `FIRST_3_VERTICAL_SLICES.md`
- `OCULOPS_TOOL_TAXONOMY.md`

## Folder structure to generate
Create a minimal but scalable structure such as:

```text
/oculops-core
  /registries
  /contracts
  /governance
  /readiness
  /cloudbot
  /validation
  /vertical-slices
  /docs
```

If a better equivalent exists in the repo, adapt to it instead of duplicating structure.

## For each artifact
Provide:
- filename
- path
- purpose
- content

## File quality standards
- explicit fields
- no magic values without explanation
- state-aware
- governance-aware
- validation-aware
- directly usable by engineers
- directly usable by later services

## Implementation constraints
- Do not generate business logic that belongs to later phases.
- Do not wire external credentials yet.
- Do not pretend a provider is live if it is not.
- Preserve simulated/pending states where required.
- Make all contracts compatible with:
  - CloudBot
  - Agent Zero
  - Ollama
  - n8n
  - SaaS action routing

## Output order
Return artifacts in exactly this order:

### 1. Folder structure
### 2. Registry schemas
### 3. Readiness schema
### 4. CloudBot operating document
### 5. Tool taxonomy
### 6. Validation matrix
### 7. Convergence matrix
### 8. First 3 vertical slices

## Final instruction
Start with the folder structure and registry schemas.
Do not restate the architecture.
Do not summarize the plan.
Just execute the first implementation wave.

---

# PROMPT 4 — REVIEW + PATCH PROMPT

Review the generated artifacts against the locked architecture and implementation plan.

Assume the artifacts were generated by a coding model and may contain:
- missing fields
- governance gaps
- weak state models
- duplicated concepts
- unclear ownership
- incomplete validation hooks
- wrong placement of capabilities
- registry inconsistencies

Your job is not to regenerate everything.
Your job is to inspect, detect defects, and produce the correction order.

## Rules
- Be harsh.
- Be precise.
- Do not explain the whole architecture again.
- Do not propose new features.
- Only identify defects, gaps, and exact corrective actions.
- Separate clearly:
  - defect
  - consequence
  - correction
  - patch order

## Required output structure

### 1. Structural Defects
What is architecturally wrong or incomplete.

### 2. Registry Defects
Missing fields, wrong fields, weak state/control modeling, missing ownership.

### 3. Governance Defects
Where permissions, policies, scopes, or readiness are weak or absent.

### 4. Validation Defects
Where the artifacts are not testable enough.

### 5. Placement Defects
Where capabilities/tools/services are assigned to the wrong layer.

### 6. Patch Order
Exact order in which corrections should be made.

### 7. Critical Blockers
What must be fixed before any further implementation.

### 8. Ready / Not Ready Verdict
Are the artifacts ready to become the real first implementation wave, or not?

## Final instruction
Return only defects, corrections, and patch order.
Do not regenerate the artifacts unless explicitly asked after the review.
