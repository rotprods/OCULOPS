#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function parseEnvContent(content) {
  const parsed = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2] ?? "";
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
}

function loadEnvFile(relativePath) {
  const filePath = path.resolve(projectRoot, relativePath);
  if (!existsSync(filePath)) return {};
  return parseEnvContent(readFileSync(filePath, "utf8"));
}

function resolveEnv(keys) {
  const merged = {
    ...loadEnvFile(".env"),
    ...loadEnvFile("supabase/.env.deploy"),
    ...process.env,
  };
  const out = {};
  for (const key of keys) out[key] = merged[key] || "";
  return out;
}

function compact(value) {
  return value == null ? "" : String(value).trim();
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function rest({
  baseUrl,
  serviceKey,
  method = "GET",
  pathName,
  query = "",
  body,
  preferRepresentation = false,
}) {
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
  if (preferRepresentation) {
    headers.Prefer = "return=representation";
  }

  const url = `${baseUrl}/rest/v1/${pathName}${query ? `?${query}` : ""}`;
  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { status: response.status, ok: response.ok, data };
}

async function callFunction({ baseUrl, serviceKey, functionName, body }) {
  const response = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  return { status: response.status, ok: response.ok, data };
}

async function ensureToolRegistryAndPermission({ baseUrl, serviceKey }) {
  const toolCheck = await rest({
    baseUrl,
    serviceKey,
    pathName: "tool_registry",
    query: "select=*&code_name=eq.api-proxy&org_id=is.null&limit=1",
  });
  assertCondition(toolCheck.ok, `Failed to query tool_registry for api-proxy (${toolCheck.status})`);
  const existingTool = Array.isArray(toolCheck.data) ? toolCheck.data[0] : null;

  let toolId = compact(existingTool?.id) || null;
  let toolCreated = false;
  if (!toolId) {
    const insertTool = await rest({
      baseUrl,
      serviceKey,
      method: "POST",
      pathName: "tool_registry",
      preferRepresentation: true,
      body: {
        org_id: null,
        name: "API Proxy",
        code_name: "api-proxy",
        category: "integration",
        description: "Unified connector proxy for external APIs.",
        input_schema: {},
        output_schema: {},
        endpoint_url: "supabase://functions/api-proxy",
        auth_type: "service_role",
        is_active: true,
        version: "1.0.0",
        cost_per_call: 0,
        metadata: { managed_by: "smoke-hard-block-routing" },
        provider: "internal",
        invocation_type: "edge_function",
        risk_level: 3,
        requires_approval: false,
        default_config: {},
      },
    });
    assertCondition(insertTool.ok, `Failed to insert tool_registry api-proxy (${insertTool.status})`);
    const row = Array.isArray(insertTool.data) ? insertTool.data[0] : null;
    toolId = compact(row?.id) || null;
    toolCreated = true;
  }
  assertCondition(Boolean(toolId), "Could not resolve api-proxy tool_registry id.");

  const permCheck = await rest({
    baseUrl,
    serviceKey,
    pathName: "agent_tool_permissions",
    query: "select=*&agent_code_name=eq.cortex&tool_code_name=eq.api-proxy&org_id=is.null&limit=1",
  });
  assertCondition(permCheck.ok, `Failed to query agent_tool_permissions for cortex/api-proxy (${permCheck.status})`);
  const existingPerm = Array.isArray(permCheck.data) ? permCheck.data[0] : null;

  let permId = compact(existingPerm?.id) || null;
  let permCreated = false;
  if (!permId) {
    const insertPerm = await rest({
      baseUrl,
      serviceKey,
      method: "POST",
      pathName: "agent_tool_permissions",
      preferRepresentation: true,
      body: {
        org_id: null,
        agent_code_name: "cortex",
        tool_code_name: "api-proxy",
        permission_level: "allow",
        daily_budget_usd: 0,
        max_calls_per_run: 25,
        is_active: true,
        metadata: { managed_by: "smoke-hard-block-routing" },
      },
    });
    assertCondition(insertPerm.ok, `Failed to insert agent_tool_permissions cortex/api-proxy (${insertPerm.status})`);
    const row = Array.isArray(insertPerm.data) ? insertPerm.data[0] : null;
    permId = compact(row?.id) || null;
    permCreated = true;
  }
  assertCondition(Boolean(permId), "Could not resolve cortex/api-proxy permission id.");

  return {
    tool_id: toolId,
    permission_id: permId,
    tool_created: toolCreated,
    permission_created: permCreated,
  };
}

async function ensureSyntheticEmailChannel({ baseUrl, serviceKey, orgId }) {
  const lookup = await rest({
    baseUrl,
    serviceKey,
    pathName: "messaging_channels",
    query: `select=*&type=eq.email&provider=eq.synthetic_gmail&status=eq.active&org_id=eq.${encodeURIComponent(orgId)}&order=updated_at.desc&limit=1`,
  });
  assertCondition(lookup.ok, `Failed to query synthetic email channel (${lookup.status})`);
  const existing = Array.isArray(lookup.data) ? lookup.data[0] : null;
  if (existing?.id) return { channel: existing, created: false };

  const created = await rest({
    baseUrl,
    serviceKey,
      method: "POST",
      pathName: "messaging_channels",
      preferRepresentation: true,
      body: {
        org_id: orgId,
        user_id: null,
        name: "Synthetic Gmail Harness",
        type: "email",
        provider: "synthetic_gmail",
      status: "active",
      is_default: true,
      email_address: "synthetic-harness@oculops.local",
      metadata: {
        synthetic_harness: true,
        managed_by: "smoke-hard-block-routing",
      },
      last_error: null,
    },
  });
  assertCondition(created.ok, `Failed to create synthetic email channel (${created.status})`);
  const row = Array.isArray(created.data) ? created.data[0] : null;
  assertCondition(Boolean(row?.id), "Synthetic email channel id missing.");
  return { channel: row, created: true };
}

async function createSyntheticConversationData({ baseUrl, serviceKey, runTag, channelId, orgId, ownerId }) {
  const email = `${runTag}@example.com`;
  const contactInsert = await rest({
    baseUrl,
    serviceKey,
      method: "POST",
      pathName: "contacts",
      preferRepresentation: true,
      body: {
        org_id: orgId,
        user_id: ownerId || null,
        name: `Smoke Contact ${runTag}`,
        email,
        status: "contacted",
      source: "smoke-hard-block-routing",
      confidence: 80,
      last_contacted_at: new Date().toISOString(),
      data: {
        smoke: true,
        run_tag: runTag,
      },
    },
  });
  assertCondition(contactInsert.ok, `Failed to create synthetic contact (${contactInsert.status})`);
  const contact = Array.isArray(contactInsert.data) ? contactInsert.data[0] : null;
  assertCondition(Boolean(contact?.id), "Synthetic contact id missing.");

  const conversationInsert = await rest({
    baseUrl,
    serviceKey,
      method: "POST",
      pathName: "conversations",
      preferRepresentation: true,
      body: {
        org_id: orgId,
        user_id: ownerId || null,
        contact_id: contact.id,
        channel: "email",
        channel_id: channelId,
      external_id: `email:${contact.id}`,
      status: "pending",
      unread_count: 0,
      assigned_to: "Automation",
      metadata: {
        smoke: true,
        run_tag: runTag,
      },
      last_message_at: new Date().toISOString(),
      last_outbound_at: new Date().toISOString(),
    },
  });
  assertCondition(conversationInsert.ok, `Failed to create synthetic conversation (${conversationInsert.status})`);
  const conversation = Array.isArray(conversationInsert.data) ? conversationInsert.data[0] : null;
  assertCondition(Boolean(conversation?.id), "Synthetic conversation id missing.");

  return { contact, conversation, email };
}

async function createWorkflow({ baseUrl, serviceKey, name, steps, metadata, orgId, ownerId }) {
  const insert = await rest({
    baseUrl,
    serviceKey,
    method: "POST",
    pathName: "automation_workflows",
    preferRepresentation: true,
    body: {
      name,
      description: "Synthetic workflow for hard-block routing smoke.",
      trigger_type: "manual",
      trigger_config: { source: "smoke-hard-block-routing" },
      is_active: true,
      org_id: orgId,
      user_id: null,
      steps,
      metadata,
    },
  });
  assertCondition(insert.ok, `Failed to create automation_workflow ${name} (${insert.status})`);
  const row = Array.isArray(insert.data) ? insert.data[0] : null;
  assertCondition(Boolean(row?.id), `Workflow id missing for ${name}`);
  return row;
}

async function runWorkflow({ baseUrl, serviceKey, workflowId, correlationId }) {
  const runResult = await callFunction({
    baseUrl,
    serviceKey,
    functionName: "automation-runner",
    body: {
      action: "run",
      workflow_id: workflowId,
      source: "smoke-hard-block-routing",
      context: {
        correlation_id: correlationId,
        trace: {
          correlation_id: correlationId,
          source: "smoke-hard-block-routing",
        },
      },
    },
  });
  assertCondition(runResult.status === 200, `automation-runner failed (${runResult.status})`);
  assertCondition(runResult.data?.ok === true, "automation-runner returned ok=false");
  const run = Array.isArray(runResult.data?.runs) ? runResult.data.runs[0] : null;
  assertCondition(Boolean(run), "automation-runner did not return run payload");
  return run;
}

async function verifyToolBusEvent({ baseUrl, serviceKey, correlationId, toolCodeName }) {
  const res = await rest({
    baseUrl,
    serviceKey,
    pathName: "event_log",
    query: `select=id,event_type,status,correlation_id,metadata,created_at&event_type=eq.tool_bus.invocation&correlation_id=eq.${encodeURIComponent(correlationId)}&order=created_at.desc&limit=10`,
  });
  assertCondition(res.ok, `Failed to query event_log for correlation ${correlationId} (${res.status})`);
  const rows = Array.isArray(res.data) ? res.data : [];
  const matched = rows.find((row) => compact(row?.metadata?.tool_code_name) === toolCodeName);
  return {
    found: Boolean(matched),
    rows: rows.length,
    matched_event_id: compact(matched?.id) || null,
  };
}

async function run() {
  const env = resolveEnv(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const baseUrl = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  assertCondition(baseUrl, "Missing SUPABASE_URL.");
  assertCondition(serviceKey, "Missing SUPABASE_SERVICE_ROLE_KEY.");

  const report = {
    generated_at: new Date().toISOString(),
    ok: false,
    setup: {},
    cases: {
      blocked_api_proxy_legacy_high: {},
      blocked_messaging_dispatch_legacy_high: {},
      allowed_run_connector_high_via_control_plane: {},
      allowed_run_api_high_via_control_plane: {},
    },
    artifacts: {
      json_path: "docs/runbooks/hard-block-routing-smoke.latest.json",
      markdown_path: "docs/runbooks/hard-block-routing-smoke.md",
    },
  };

  const orgLookup = await rest({
    baseUrl,
    serviceKey,
    pathName: "organizations",
    query: "select=id,owner_id&order=created_at.asc&limit=1",
  });
  assertCondition(orgLookup.ok, `Failed to query organizations (${orgLookup.status})`);
  const orgRow = Array.isArray(orgLookup.data) ? orgLookup.data[0] : null;
  const orgId = compact(orgRow?.id);
  const ownerId = compact(orgRow?.owner_id) || null;
  assertCondition(Boolean(orgId), "Could not resolve org_id.");
  report.setup.org_id = orgId;
  report.setup.owner_id = ownerId;

  const setupProxyPolicy = await ensureToolRegistryAndPermission({ baseUrl, serviceKey });
  report.setup.api_proxy_policy = setupProxyPolicy;

  const connectorLookup = await rest({
    baseUrl,
    serviceKey,
    pathName: "api_connectors",
    query: "select=id,name,auth_type,is_active,health_status,healthcheck_endpoint,endpoints&auth_type=eq.none&is_active=eq.true&order=created_at.asc&limit=1",
  });
  assertCondition(connectorLookup.ok, `Failed to query connectors (${connectorLookup.status})`);
  const connector = Array.isArray(connectorLookup.data) ? connectorLookup.data[0] : null;
  assertCondition(Boolean(connector?.id), "No active auth_type=none connector available for smoke.");
  report.setup.connector = {
    id: connector.id,
    name: connector.name,
    health_status: connector.health_status,
  };

  const channelSetup = await ensureSyntheticEmailChannel({ baseUrl, serviceKey, orgId });
  report.setup.synthetic_email_channel = {
    id: channelSetup.channel.id,
    created: channelSetup.created,
  };

  const runTag = `smoke-route-${Date.now()}`;
  const convoData = await createSyntheticConversationData({
    baseUrl,
    serviceKey,
    runTag,
    channelId: channelSetup.channel.id,
    orgId,
    ownerId,
  });
  report.setup.synthetic_contact = { id: convoData.contact.id, email: convoData.email };
  report.setup.synthetic_conversation = { id: convoData.conversation.id };

  // Case 1: direct legacy high-risk call to api-proxy must block with 409.
  const blockedApiProxy = await callFunction({
    baseUrl,
    serviceKey,
    functionName: "api-proxy",
    body: {
      connector_id: connector.id,
      healthcheck: true,
      source: "automation_workflow",
      risk_class: "high",
      metadata: {
        source: "automation_workflow",
      },
    },
  });
  report.cases.blocked_api_proxy_legacy_high = {
    status: blockedApiProxy.status,
    ok: blockedApiProxy.ok,
    code: compact(blockedApiProxy.data?.code) || null,
    error: compact(blockedApiProxy.data?.error) || null,
    pass:
      blockedApiProxy.status === 409 &&
      compact(blockedApiProxy.data?.code) === "legacy_high_risk_route_required",
    note:
      blockedApiProxy.status === 503 && compact(blockedApiProxy.data?.code) === "BOOT_ERROR"
        ? "api-proxy remote function has BOOT_ERROR; legacy hard-block assertion is inconclusive."
        : null,
  };

  // Case 2: direct legacy high-risk call to messaging-dispatch must block with 409.
  const blockedMessaging = await callFunction({
    baseUrl,
    serviceKey,
    functionName: "messaging-dispatch",
    body: {
      conversation_id: convoData.conversation.id,
      channel_id: channelSetup.channel.id,
      channel: "email",
      to: convoData.email,
      subject: "Smoke blocked legacy routing",
      body: "This should be blocked before provider dispatch.",
      source: "automation_workflow",
      risk_class: "high",
      metadata: {
        source: "automation_workflow",
      },
    },
  });
  report.cases.blocked_messaging_dispatch_legacy_high = {
    status: blockedMessaging.status,
    ok: blockedMessaging.ok,
    code: compact(blockedMessaging.data?.code) || null,
    error: compact(blockedMessaging.data?.error) || null,
    pass:
      blockedMessaging.status === 409 &&
      compact(blockedMessaging.data?.code) === "legacy_high_risk_route_required",
  };
  // Case 3: legacy workflow run_connector high-risk must route via control-plane/tool-bus and not be blocked.
  try {
    const connectorWorkflow = await createWorkflow({
      baseUrl,
      serviceKey,
      name: `Smoke · run_connector high · ${runTag}`,
      metadata: {
        smoke: true,
        run_tag: runTag,
        agent_code_name: "cortex",
      },
      steps: [
        {
          id: "connector-high",
          type: "run_connector",
          config: {
            connector_id: connector.id,
            healthcheck: true,
            risk_class: "high",
          },
        },
      ],
      orgId,
      ownerId,
    });
    const connectorCorrelation = crypto.randomUUID();
    const connectorRun = await runWorkflow({
      baseUrl,
      serviceKey,
      workflowId: connectorWorkflow.id,
      correlationId: connectorCorrelation,
    });
    const connectorRunStatus = compact(connectorRun?.run?.status) || null;
    const connectorStep = Array.isArray(connectorRun?.steps) ? connectorRun.steps[0] : null;
    const connectorStepError = compact(connectorStep?.error || connectorRun?.error) || null;
    const connectorToolBus = await verifyToolBusEvent({
      baseUrl,
      serviceKey,
      correlationId: connectorCorrelation,
      toolCodeName: "api-proxy",
    });
    const connectorStepErrorText = connectorStepError || "";
    const legacyRouteBlocked =
      connectorStepErrorText.includes("legacy_high_risk_route_required") ||
      connectorStepErrorText.includes("legacy_high_risk_missing_tool_bus_trace");
    report.cases.allowed_run_connector_high_via_control_plane = {
      workflow_id: connectorWorkflow.id,
      run_status: connectorRunStatus,
      step_status: compact(connectorStep?.status) || null,
      step_error: connectorStepError,
      tool_bus_event_found: connectorToolBus.found,
      tool_bus_rows: connectorToolBus.rows,
      pass: connectorRunStatus === "completed" && connectorToolBus.found,
      routed_not_legacy_blocked: connectorToolBus.found && !legacyRouteBlocked,
    };
  } catch (error) {
    report.cases.allowed_run_connector_high_via_control_plane = {
      pass: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Case 4: legacy workflow run_api high-risk must route via control-plane/tool-bus and not be blocked.
  try {
    const apiWorkflow = await createWorkflow({
      baseUrl,
      serviceKey,
      name: `Smoke · run_api high · ${runTag}`,
      metadata: {
        smoke: true,
        run_tag: runTag,
        agent_code_name: "cortex",
      },
      steps: [
        {
          id: "api-high",
          type: "run_api",
          config: {
            endpoint: "event-dispatcher",
            risk_class: "high",
            payload: {
              event_type: "smoke.hard_block_routing",
              payload: {
                smoke: true,
                run_tag: runTag,
              },
            },
          },
        },
      ],
      orgId,
      ownerId,
    });
    const apiCorrelation = crypto.randomUUID();
    const apiRun = await runWorkflow({
      baseUrl,
      serviceKey,
      workflowId: apiWorkflow.id,
      correlationId: apiCorrelation,
    });
    const apiRunStatus = compact(apiRun?.run?.status) || null;
    const apiStep = Array.isArray(apiRun?.steps) ? apiRun.steps[0] : null;
    const apiStepError = compact(apiStep?.error || apiRun?.error) || null;
    const apiToolBus = await verifyToolBusEvent({
      baseUrl,
      serviceKey,
      correlationId: apiCorrelation,
      toolCodeName: "event-dispatcher",
    });
    const apiStepErrorText = apiStepError || "";
    const legacyRouteBlocked =
      apiStepErrorText.includes("legacy_high_risk_route_required") ||
      apiStepErrorText.includes("legacy_high_risk_missing_tool_bus_trace");
    report.cases.allowed_run_api_high_via_control_plane = {
      workflow_id: apiWorkflow.id,
      run_status: apiRunStatus,
      step_status: compact(apiStep?.status) || null,
      step_error: apiStepError,
      tool_bus_event_found: apiToolBus.found,
      tool_bus_rows: apiToolBus.rows,
      pass: apiRunStatus === "completed" && apiToolBus.found,
      routed_not_legacy_blocked: apiToolBus.found && !legacyRouteBlocked,
    };
  } catch (error) {
    report.cases.allowed_run_api_high_via_control_plane = {
      pass: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  report.ok = Object.values(report.cases).every((entry) => entry && entry.pass === true);

  const runbookDir = path.resolve(projectRoot, "docs/runbooks");
  await mkdir(runbookDir, { recursive: true });
  const jsonPath = path.resolve(runbookDir, "hard-block-routing-smoke.latest.json");
  const markdownPath = path.resolve(runbookDir, "hard-block-routing-smoke.md");

  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  const markdown = [
    "# Hard-Block Routing Smoke",
    "",
    `Generated at: ${report.generated_at}`,
    `Result: ${report.ok ? "PASS" : "FAIL"}`,
    "",
    "## Cases",
    "",
    `- blocked_api_proxy_legacy_high: ${report.cases.blocked_api_proxy_legacy_high.pass ? "PASS" : "FAIL"}`,
    `- blocked_messaging_dispatch_legacy_high: ${report.cases.blocked_messaging_dispatch_legacy_high.pass ? "PASS" : "FAIL"}`,
    `- allowed_run_connector_high_via_control_plane: ${report.cases.allowed_run_connector_high_via_control_plane.pass ? "PASS" : "FAIL"}`,
    `- allowed_run_api_high_via_control_plane: ${report.cases.allowed_run_api_high_via_control_plane.pass ? "PASS" : "FAIL"}`,
    "",
    "## Artifacts",
    "",
    `- JSON: \`${report.artifacts.json_path}\``,
    `- Markdown: \`${report.artifacts.markdown_path}\``,
    "",
  ].join("\n");
  await writeFile(markdownPath, markdown, "utf8");

  console.log(JSON.stringify(report, null, 2));
}

run().catch(async (error) => {
  const runbookDir = path.resolve(projectRoot, "docs/runbooks");
  await mkdir(runbookDir, { recursive: true });
  const failurePath = path.resolve(runbookDir, "hard-block-routing-smoke.latest.json");
  const payload = {
    ok: false,
    generated_at: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
  };
  await writeFile(failurePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.error("[smoke-hard-block-routing] failed");
  console.error(payload.error);
  process.exit(1);
});
