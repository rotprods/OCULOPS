import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const AGENT_CODE = 'scribe';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const { action = 'daily_report', task_id } = body;
    const { data: agent } = await supabase.from('agent_registry').select('*').eq('code_name', AGENT_CODE).single();
    if (!agent) throw new Error('Agent not found');
    await supabase.from('agent_registry').update({ status: 'running', last_run_at: new Date().toISOString() }).eq('id', agent.id);

    let result: any = {};
    const today = new Date().toISOString().split('T')[0];

    if (action === 'daily_report' || action === 'cycle') {
      // Collect all metrics
      const [contactsRes, dealsRes, tasksRes, alertsRes, campaignsRes, financeRes, logsRes] = await Promise.all([
        supabase.from('contacts').select('id, status, score', { count: 'exact' }),
        supabase.from('deals').select('id, value, stage, probability', { count: 'exact' }),
        supabase.from('tasks').select('id, status, priority', { count: 'exact' }),
        supabase.from('alerts').select('id, severity, status', { count: 'exact' }),
        supabase.from('campaigns').select('id, status, budget, spent', { count: 'exact' }),
        supabase.from('finance_entries').select('id, type, amount', { count: 'exact' }),
        supabase.from('agent_logs').select('agent_code_name, duration_ms, tokens_used').gte('created_at', `${today}T00:00:00`)
      ]);

      const contacts = contactsRes.data || [];
      const deals = dealsRes.data || [];
      const tasks = tasksRes.data || [];
      const alerts = alertsRes.data || [];
      const campaigns = campaignsRes.data || [];
      const finance = financeRes.data || [];
      const agentLogs = logsRes.data || [];

      const pipelineValue = deals.reduce((s, d) => s + (d.value || 0), 0);
      const weightedPipeline = deals.reduce((s, d) => s + (d.value || 0) * ((d.probability || 0) / 100), 0);
      const income = finance.filter(f => f.type === 'income').reduce((s, f) => s + (f.amount || 0), 0);
      const expenses = finance.filter(f => f.type === 'expense').reduce((s, f) => s + Math.abs(f.amount || 0), 0);
      const activeAlerts = alerts.filter(a => a.status === 'active').length;

      const report = {
        date: today,
        summary: {
          contacts_total: contacts.length,
          contacts_raw: contacts.filter(c => c.status === 'raw').length,
          contacts_qualified: contacts.filter(c => c.status === 'qualified').length,
          contacts_client: contacts.filter(c => c.status === 'client').length,
          deals_total: deals.length,
          pipeline_value: pipelineValue,
          weighted_pipeline: weightedPipeline,
          tasks_total: tasks.length,
          tasks_completed: tasks.filter(t => t.status === 'completed').length,
          tasks_pending: tasks.filter(t => t.status === 'pending').length,
          alerts_active: activeAlerts,
          campaigns_active: campaigns.filter(c => c.status === 'active').length,
          budget_total: campaigns.reduce((s, c) => s + (c.budget || 0), 0),
          budget_spent: campaigns.reduce((s, c) => s + (c.spent || 0), 0),
          mrr: income,
          burn_rate: expenses,
          net: income - expenses
        },
        agent_activity: {
          total_runs_today: agentLogs.length,
          total_tokens_today: agentLogs.reduce((s, l) => s + (l.tokens_used || 0), 0),
          agents_active: [...new Set(agentLogs.map(l => l.agent_code_name))]
        }
      };

      // Check for existing snapshot today and update or insert
      const { data: existing } = await supabase.from('daily_snapshots').select('id').eq('date', today).limit(1);
      if (existing && existing.length > 0) {
        await supabase.from('daily_snapshots').update({
          mrr: report.summary.mrr,
          clients: report.summary.contacts_client,
          pipeline_value: pipelineValue,
          tasks_completed: report.summary.tasks_completed,
          leads_generated: report.summary.contacts_raw,
          alerts_active: activeAlerts,
          health_score: Math.min(100, Math.max(0, 100 - activeAlerts * 10 - report.summary.tasks_pending * 2)),
          data: report
        }).eq('id', existing[0].id);
      } else {
        await supabase.from('daily_snapshots').insert({
          date: today,
          mrr: report.summary.mrr,
          clients: report.summary.contacts_client,
          pipeline_value: pipelineValue,
          tasks_completed: report.summary.tasks_completed,
          leads_generated: report.summary.contacts_raw,
          alerts_active: activeAlerts,
          health_score: Math.min(100, Math.max(0, 100 - activeAlerts * 10 - report.summary.tasks_pending * 2)),
          data: report
        });
      }

      result = report;
    }

    const duration = Date.now() - startTime;
    await supabase.from('agent_registry').update({ status: 'online', total_runs: (agent.total_runs || 0) + 1 }).eq('id', agent.id);
    if (task_id) await supabase.from('agent_tasks').update({ status: 'completed', result, completed_at: new Date().toISOString() }).eq('id', task_id);
    await supabase.from('agent_logs').insert({ agent_id: agent.id, agent_code_name: AGENT_CODE, task_id, action, input: body, output: result, duration_ms: duration });

    return new Response(JSON.stringify({ success: true, agent: AGENT_CODE, result, duration_ms: duration }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    await supabase.from('agent_registry').update({ status: 'error' }).eq('code_name', AGENT_CODE);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
