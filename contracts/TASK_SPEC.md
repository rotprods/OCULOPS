# TASK_SPEC.md — Universal Task Contract

Version: 2026-03-13  
Owner: agent-2-codex  
Purpose: Standard task entry format for all orchestrated execution.

---

## Required Fields

Every task must include:

1. `task_id` (string, unique)
2. `goal` (string, business outcome)
3. `task_type` (`pipeline` | `agent_action` | `workflow` | `evaluation` | `simulation`)
4. `priority` (`low` | `medium` | `high` | `critical`)
5. `risk_class` (`low` | `medium` | `high` | `critical`)
6. `owner_agent_id` (string, canonical agent id)
7. `inputs` (object, compliant with `INPUT_CONTRACT.json`)
8. `expected_output_contract` (ref into `OUTPUT_CONTRACT.json`)
9. `eval_contract` (ref to `EVAL_CONTRACT.json`)
10. `policy` (object)
11. `trace` (object)

---

## Policy Subobject

`policy` must include:

- `autonomy_level`
- `approval_required`
- `simulation_required`
- `max_retries`
- `budget_cap_usd`
- `allowed_tools`

---

## Trace Subobject

`trace` must include:

- `correlation_id`
- `pipeline_run_id` (nullable at creation if not created yet)
- `parent_task_id` (nullable)
- `source` (`copilot` | `workflow` | `manual` | `system`)
- `created_at`

---

## Minimal Example

```json
{
  "task_id": "task_20260313_0001",
  "goal": "Launch a sales outreach workflow for Madrid fintech leads",
  "task_type": "pipeline",
  "priority": "high",
  "risk_class": "high",
  "owner_agent_id": "agent-copilot",
  "inputs": {
    "template_code_name": "sales_outreach",
    "context": {
      "segment": "fintech",
      "city": "Madrid"
    }
  },
  "expected_output_contract": "contracts/OUTPUT_CONTRACT.json#/$defs/pipeline_run_result",
  "eval_contract": "contracts/EVAL_CONTRACT.json",
  "policy": {
    "autonomy_level": "supervised",
    "approval_required": true,
    "simulation_required": true,
    "max_retries": 1,
    "budget_cap_usd": 50,
    "allowed_tools": [
      "orchestration-engine",
      "messaging-dispatch"
    ]
  },
  "trace": {
    "correlation_id": "uuid-v4",
    "pipeline_run_id": null,
    "parent_task_id": null,
    "source": "copilot",
    "created_at": "2026-03-13T00:00:00.000Z"
  }
}
```

---

## Validation Rules

1. Reject task if `owner_agent_id` is not in `registry/agent_registry.json`.
2. Reject task if any `allowed_tools` is not in `registry/tool_registry.json`.
3. Force `approval_required = true` when policy/risk/tool rules require it.
4. Force `simulation_required = true` for `risk_class in ['high', 'critical']`.
5. Reject task if output/eval contract refs are missing.
