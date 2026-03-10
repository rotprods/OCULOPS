import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const body = await req.json().catch(() => ({}));

    if (body.action === 'list') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase.from('prediction_tracking').select('*')
        .is('accuracy_score', null).gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false });
      return new Response(JSON.stringify({ success: true, unvalidated_count: data?.length || 0, predictions: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (body.action === 'stats') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: validated } = await supabase.from('prediction_tracking').select('accuracy_score, source, category')
        .not('accuracy_score', 'is', null).gte('created_at', thirtyDaysAgo);
      const { data: total } = await supabase.from('prediction_tracking').select('id').gte('created_at', thirtyDaysAgo);
      const avg = validated?.length ? Math.round(validated.reduce((s, p) => s + (p.accuracy_score||0), 0) / validated.length) : null;
      return new Response(JSON.stringify({ success: true, stats: {
        total_predictions: total?.length||0, validated: validated?.length||0,
        pending: (total?.length||0) - (validated?.length||0), avg_accuracy: avg
      }}), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (body.action === 'validate' && body.prediction_id) {
      const { data, error } = await supabase.from('prediction_tracking').update({
        accuracy_score: body.accuracy_score, actual_outcome: body.actual_outcome,
        validated_at: new Date().toISOString(), validated_by: 'manual'
      }).eq('id', body.prediction_id).select();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, updated: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (body.action === 'batch_validate') {
      let updated = 0;
      for (const v of (body.validations || [])) {
        const { error } = await supabase.from('prediction_tracking').update({
          accuracy_score: v.accuracy_score, actual_outcome: v.outcome || '',
          validated_at: new Date().toISOString(), validated_by: 'manual'
        }).eq('id', v.id);
        if (!error) updated++;
      }
      return new Response(JSON.stringify({ success: true, updated }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: false, error: 'Use action: list, stats, validate, batch_validate' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
