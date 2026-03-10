import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const AGENT_CODE = 'oracle';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const { action = 'analyze', task_id } = body;
    const { data: agent } = await supabase.from('agent_registry').select('*').eq('code_name', AGENT_CODE).single();
    if (!agent) throw new Error('Agent not found');
    await supabase.from('agent_registry').update({ status: 'running', last_run_at: new Date().toISOString() }).eq('id', agent.id);
    if (task_id) await supabase.from('agent_tasks').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', task_id);

    let result: any = {};

    if (action === 'analyze' || action === 'cycle') {
      // Cross-table data collection
      const [contactsRes, dealsRes, campaignsRes, signalsRes, financeRes, tasksRes, alertsRes] = await Promise.all([
        supabase.from('contacts').select('id, status, score, created_at').limit(100),
        supabase.from('deals').select('id, stage, value, probability, created_at').limit(100),
        supabase.from('campaigns').select('id, status, budget, spent, channel').limit(50),
        supabase.from('signals').select('id, category, impact, confidence, status').limit(50),
        supabase.from('finance_entries').select('id, type, amount, category').limit(100),
        supabase.from('tasks').select('id, status, priority').limit(100),
        supabase.from('alerts').select('id, severity, status').limit(50)
      ]);

      const snapshot = {
        contacts: { total: (contactsRes.data || []).length, by_status: {} as any },
        deals: { total: (dealsRes.data || []).length, pipeline_value: (dealsRes.data || []).reduce((s,d) => s + (d.value || 0), 0), weighted_pipeline: (dealsRes.data || []).reduce((s,d) => s + (d.value || 0) * ((d.probability || 0) / 100), 0) },
        campaigns: { total: (campaignsRes.data || []).length, total_budget: (campaignsRes.data || []).reduce((s,c) => s + (c.budget || 0), 0), total_spent: (campaignsRes.data || []).reduce((s,c) => s + (c.spent || 0), 0) },
        signals: { total: (signalsRes.data || []).length, active: (signalsRes.data || []).filter(s => s.status === 'active').length },
        finance: { total_income: (financeRes.data || []).filter(f => f.type === 'income').reduce((s,f) => s + (f.amount || 0), 0), total_expense: (financeRes.data || []).filter(f => f.type === 'expense').reduce((s,f) => s + Math.abs(f.amount || 0), 0) },
        tasks: { total: (tasksRes.data || []).length, completed: (tasksRes.data || []).filter(t => t.status === 'completed').length, pending: (tasksRes.data || []).filter(t => t.status === 'pending').length },
        alerts: { active: (alertsRes.data || []).filter(a => a.status === 'active').length }
      };

      // Count contact statuses
      for (const c of (contactsRes.data || [])) { snapshot.contacts.by_status[c.status] = (snapshot.contacts.by_status[c.status] || 0) + 1; }

      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      let aiInsights = null;

      if (openaiKey) {
        const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: `Eres ORACLE, motor analítico de una agencia de IA en Murcia.\n\nDatos del sistema:\n${JSON.stringify(snapshot, null, 2)}\n\nGenera un análisis ejecutivo JSON con:\n1. "health_score": 0-100\n2. "key_insights": 3 insights de los datos\n3. "bottlenecks": 2 cuellos de botella detectados\n4. "recommendations": 2 acciones prioritarias\n5. "mrr_estimate": estimación MRR basada en deals\n\nJSON válido solamente.` }],
            temperature: 0.4, max_tokens: 800
          })
        });

        if (aiRes.ok) {
          const d = await aiRes.json();
          const c = d.choices?.[0]?.message?.content || '';
          try { aiInsights = JSON.parse(c.replace(/```json\n?|```/g, '')); } catch { aiInsights = { raw: c }; }
        }
      }

      // Insert daily snapshot
      await supabase.from('daily_snapshots').insert({
        date: new Date().toISOString().split('T')[0],
        mrr: aiInsights?.mrr_estimate || 0,
        clients: snapshot.contacts.by_status?.['client'] || 0,
        pipeline_value: snapshot.deals.pipeline_value,
        tasks_completed: snapshot.tasks.completed,
        leads_generated: snapshot.contacts.by_status?.['raw'] || 0,
        alerts_active: snapshot.alerts.active,
        health_score: aiInsights?.health_score || 0,
        data: { snapshot, ai_analysis: aiInsights }
      });

      await supabase.from('knowledge_entries').insert({
        title: `ORACLE Analysis — ${new Date().toISOString().split('T')[0]}`,
        content: JSON.stringify({ snapshot, ai_analysis: aiInsights }, null, 2),
        category: 'analytics', type: 'ai_generated', source: 'ORACLE',
        tags: ['analytics','insights','auto']
      });

      result = { snapshot, ai_analysis: aiInsights };
    }

    const duration = Date.now() - startTime;
    await supabase.from('agent_registry').update({ status: 'online', total_runs: (agent.total_runs || 0) + 1, avg_duration_ms: Math.round(((agent.avg_duration_ms || 0) * (agent.total_runs || 0) + duration) / ((agent.total_runs || 0) + 1)) }).eq('id', agent.id);
    if (task_id) await supabase.from('agent_tasks').update({ status: 'completed', result, completed_at: new Date().toISOString() }).eq('id', task_id);
    await supabase.from('agent_logs').insert({ agent_id: agent.id, agent_code_name: AGENT_CODE, task_id, action, input: body, output: result, duration_ms: duration });

    return new Response(JSON.stringify({ success: true, agent: AGENT_CODE, result, duration_ms: duration }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    await supabase.from('agent_registry').update({ status: 'error' }).eq('code_name', AGENT_CODE);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
