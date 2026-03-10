import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createAgentStudy, deliverAgentStudy, loadAgentStudyById } from "../_shared/agents.ts";
import { errorResponse, handleCors, jsonResponse, readJson } from "../_shared/http.ts";
import { getAuthUser } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const user = await getAuthUser(req);
    const body = await readJson<{
      action?: string;
      study_id?: string;
      user_id?: string | null;
      agent_code_name?: string;
      title?: string;
      summary?: string;
      content_markdown?: string;
      content_json?: Record<string, unknown>;
      highlights?: string[];
      tags?: string[];
      study_type?: string;
      metadata?: Record<string, unknown>;
      send_telegram?: boolean;
    }>(req);

    const userId = user?.id || body.user_id || null;
    const action = body.action || "create";

    if (action === "send_existing") {
      if (!body.study_id) return errorResponse("study_id is required");
      const study = await loadAgentStudyById(body.study_id, userId);
      if (!study) return errorResponse("Study not found", 404);

      const delivery = await deliverAgentStudy(study, {
        userId,
        manual: study.source === "manual",
      });

      return jsonResponse({
        ok: true,
        study,
        delivery,
      });
    }

    if (!body.agent_code_name || !body.title) {
      return errorResponse("agent_code_name and title are required");
    }

    const study = await createAgentStudy({
      userId,
      agentCodeName: body.agent_code_name,
      source: "manual",
      studyType: body.study_type || "manual",
      title: body.title,
      summary: body.summary || null,
      contentMarkdown: body.content_markdown || body.summary || "",
      contentJson: body.content_json || {},
      highlights: body.highlights || [],
      tags: body.tags || [],
      metadata: body.metadata || {},
    });

    const delivery = body.send_telegram === false
      ? { delivered: false, reason: "Telegram delivery skipped" }
      : await deliverAgentStudy(study, {
        userId,
        manual: true,
      });

    return jsonResponse({
      ok: true,
      study,
      delivery,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Agent studies failed", 500);
  }
});
