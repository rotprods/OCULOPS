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
    const { business_name, niche, pain_points, recommended_services } = body;

    if (!business_name || !niche) {
      return new Response(JSON.stringify({ success: false, error: 'business_name and niche required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get service packages for this niche
    const { data: packages } = await supabase.from('service_packages')
      .select('*').eq('niche', niche).eq('is_active', true)
      .order('price_monthly', { ascending: true });

    const pkgs = packages || [];

    // Build packages HTML
    const packagesHtml = pkgs.map((pkg, i) => {
      const features = typeof pkg.features === 'string' ? JSON.parse(pkg.features) : (pkg.features || []);
      const isFeatured = i === 1; // Growth tier highlighted
      return `<div class="package${isFeatured ? ' featured' : ''}">
        <h3>${pkg.name}</h3>
        <div class="price">${pkg.price_monthly}\u20ac<span>/mes</span></div>
        <ul>${features.map((f: string) => `<li>${f}</li>`).join('')}</ul>
      </div>`;
    }).join('');

    // Generate full proposal HTML
    const proposalHtml = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#e2e8f0}
  .page{max-width:800px;margin:0 auto;background:linear-gradient(180deg,#0a0a0a,#1a1a2e)}
  .cover{padding:80px 40px;text-align:center;border-bottom:1px solid rgba(124,58,237,0.2)}
  .cover h1{font-size:32px;font-weight:300;letter-spacing:3px;margin-bottom:8px}
  .cover .glow{width:80px;height:3px;background:linear-gradient(90deg,#7c3aed,#3b82f6);margin:16px auto;border-radius:2px}
  .cover h2{font-size:20px;color:#a78bfa;font-weight:400;margin-top:24px}
  .cover p{color:#64748b;font-size:14px;margin-top:8px}
  .section{padding:40px}
  .section h2{font-size:22px;margin-bottom:20px;color:#fff}
  .section h2 span{color:#7c3aed}
  .section p{color:#94a3b8;font-size:15px;line-height:1.7;margin-bottom:16px}
  .pain-card{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:20px;margin:12px 0}
  .pain-card h4{color:#ef4444;font-size:14px;margin-bottom:8px}
  .pain-card p{color:#94a3b8;font-size:14px;margin:0}
  .solution-card{background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:12px;padding:20px;margin:12px 0}
  .solution-card h4{color:#7c3aed;font-size:14px;margin-bottom:8px}
  .solution-card p{color:#cbd5e1;font-size:14px;margin:0}
  .funnel{padding:40px;text-align:center}
  .funnel-step{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:16px;margin:8px auto;transition:all 0.3s}
  .funnel-step:nth-child(1){max-width:100%;border-color:rgba(124,58,237,0.3)}
  .funnel-step:nth-child(2){max-width:85%;border-color:rgba(99,102,241,0.3)}
  .funnel-step:nth-child(3){max-width:70%;border-color:rgba(59,130,246,0.3)}
  .funnel-step:nth-child(4){max-width:55%;border-color:rgba(34,197,94,0.3);background:rgba(34,197,94,0.08)}
  .funnel-step h4{color:#fff;font-size:14px;margin-bottom:4px}
  .funnel-step p{color:#64748b;font-size:12px;margin:0}
  .packages{padding:40px}
  .package{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;margin:16px 0;text-align:center}
  .package.featured{border-color:#7c3aed;box-shadow:0 0 30px rgba(124,58,237,0.15)}
  .package h3{color:#fff;font-size:18px;margin-bottom:4px}
  .package .price{color:#7c3aed;font-size:32px;font-weight:700;margin:8px 0}
  .package .price span{font-size:14px;color:#64748b;font-weight:400}
  .package ul{list-style:none;text-align:left;margin:16px 0}
  .package li{color:#cbd5e1;font-size:13px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
  .package li::before{content:"\u2713 ";color:#7c3aed}
  .cta-section{padding:40px;text-align:center}
  .cta-btn{display:inline-block;background:linear-gradient(135deg,#7c3aed,#3b82f6);color:#fff;font-size:18px;font-weight:600;padding:16px 40px;border-radius:10px;text-decoration:none;box-shadow:0 4px 20px rgba(124,58,237,0.4)}
  .footer{padding:30px;text-align:center;border-top:1px solid rgba(255,255,255,0.05)}
  .footer p{color:#475569;font-size:12px}
</style></head><body>
<div class="page">
  <div class="cover">
    <h1>ANTIGRAVITY</h1>
    <div class="glow"></div>
    <h2>Propuesta Personalizada</h2>
    <p>Preparada para ${business_name}</p>
    <p style="margin-top:4px;color:#475569">${new Date().toLocaleDateString('es-ES', { year:'numeric', month:'long', day:'numeric' })}</p>
  </div>

  <div class="section">
    <h2>\u{1F50D} <span>El Problema</span></h2>
    <p>Hemos analizado tu presencia digital y hemos identificado oportunidades clave para hacer crecer tu negocio:</p>
    ${(pain_points || ['Tu presencia online no refleja la calidad de tu servicio', 'Estás perdiendo clientes potenciales que buscan online', 'Tus competidores ya están usando herramientas digitales avanzadas']).map((p: string) => `<div class="pain-card"><h4>\u26a0\ufe0f Oportunidad</h4><p>${p}</p></div>`).join('')}
  </div>

  <div class="section">
    <h2>\u{1F680} <span>La Solución</span></h2>
    <p>ANTIGRAVITY es una agencia boutique de IA en Murcia. Diseñamos soluciones personalizadas que transforman tu presencia digital:</p>
    ${(recommended_services || ['Marketing digital con IA que atrae clientes automáticamente', 'Automatización de procesos que ahorra tiempo y dinero', 'Presencia online premium que transmite profesionalidad']).map((s: string) => `<div class="solution-card"><h4>\u2705 Solución</h4><p>${s}</p></div>`).join('')}
  </div>

  <div class="funnel">
    <h2 style="color:#fff;font-size:22px;margin-bottom:24px">\u{1F4CA} Tu Embudo de Crecimiento</h2>
    <div class="funnel-step"><h4>1. Visibilidad</h4><p>Google Ads + SEO + Redes Sociales \u2192 Te encuentran</p></div>
    <div class="funnel-step"><h4>2. Interés</h4><p>Web premium + Contenido IA \u2192 Se interesan</p></div>
    <div class="funnel-step"><h4>3. Conversión</h4><p>Chatbot IA + Formularios \u2192 Piden cita</p></div>
    <div class="funnel-step"><h4>4. Fidelización</h4><p>Email marketing + Automatización \u2192 Vuelven</p></div>
  </div>

  <div class="packages">
    <h2 style="color:#fff;font-size:22px;margin-bottom:8px">\u{1F4E6} Paquetes de Servicio</h2>
    <p style="color:#64748b;font-size:14px;margin-bottom:20px">Elige el nivel que mejor se adapte a tu negocio</p>
    ${packagesHtml}
  </div>

  <div class="cta-section">
    <p style="color:#e2e8f0;font-size:16px;margin-bottom:20px">¿Listo para desafiar la gravedad?</p>
    <a href="https://calendly.com/antigravity-murcia/30min" class="cta-btn">\u{1F4C5} Reservar Llamada Gratuita</a>
    <p style="color:#64748b;font-size:12px;margin-top:16px">15 minutos, sin compromiso</p>
  </div>

  <div class="footer">
    <p>ANTIGRAVITY \u2014 Agencia IA Boutique</p>
    <p>Murcia, España \u2022 antigravity.ia</p>
  </div>
</div></body></html>`;

    return new Response(JSON.stringify({
      success: true,
      proposal_html: proposalHtml,
      business_name,
      niche,
      packages_count: pkgs.length
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
