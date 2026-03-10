import { admin } from "./supabase.ts";
import { compact } from "./http.ts";
import { normalizeLead, qualifyLead, type WebsiteAnalysis } from "./lead-intel.ts";

function applyLeadScope(query: any, userId: string | null | undefined) {
  return userId ? query.eq("user_id", userId) : query.is("user_id", null);
}

function preserveLeadStatus(nextStatus: string, existingStatus?: string | null) {
  if (!existingStatus) return nextStatus;
  if (["pursuing", "promoted", "dismissed"].includes(existingStatus)) return existingStatus;
  if (existingStatus === "qualified" && nextStatus === "detected") return existingStatus;
  return nextStatus;
}

export async function loadLeadById(leadId: string) {
  const { data, error } = await admin
    .from("prospector_leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (error) throw error;
  return data as Record<string, unknown> | null;
}

export async function findExistingProspectorLead(userId: string | null | undefined, leadInput: Record<string, unknown>) {
  const lead = normalizeLead(leadInput);
  const lookups = [
    lead.place_id ? ["place_id", lead.place_id] : null,
    lead.google_maps_id ? ["google_maps_id", lead.google_maps_id] : null,
  ].filter(Boolean) as Array<[string, string]>;

  for (const [column, value] of lookups) {
    let query = admin
      .from("prospector_leads")
      .select("*")
      .eq(column, value)
      .limit(1);

    query = applyLeadScope(query, userId);

    const { data, error } = await query;
    if (error) throw error;
    if (data?.[0]) return data[0] as Record<string, unknown>;
  }

  if (!lead.name) return null;

  let query = admin
    .from("prospector_leads")
    .select("*")
    .eq("name", lead.name)
    .limit(1);

  query = applyLeadScope(query, userId);

  if (lead.address) query = query.eq("address", lead.address);

  const { data, error } = await query;
  if (error) throw error;
  return data?.[0] || null;
}

export function buildProspectorLeadRow({
  leadInput,
  userId,
  scanId,
  source,
  analysis,
  qualification,
}: {
  leadInput: Record<string, unknown>;
  userId: string | null | undefined;
  scanId?: string | null;
  source?: string | null;
  analysis?: WebsiteAnalysis | null;
  qualification?: Awaited<ReturnType<typeof qualifyLead>> | null;
}) {
  const lead = normalizeLead(leadInput);
  const resolvedQualification = qualification || null;

  return {
    user_id: userId || null,
    scan_id: scanId || null,
    place_id: lead.place_id,
    google_maps_id: lead.google_maps_id,
    name: lead.name,
    business_name: lead.name,
    address: lead.address,
    city: lead.city,
    phone: lead.phone,
    website: lead.website,
    category: lead.category,
    rating: lead.rating,
    review_count: lead.review_count || 0,
    reviews_count: lead.review_count || 0,
    lat: Number.isFinite(lead.lat as number) ? lead.lat : null,
    lng: Number.isFinite(lead.lng as number) ? lead.lng : null,
    latitude: Number.isFinite(lead.lat as number) ? lead.lat : null,
    longitude: Number.isFinite(lead.lng as number) ? lead.lng : null,
    source: compact(source) || lead.source || "atlas",
    status: resolvedQualification?.status || lead.status || "detected",
    score: resolvedQualification?.aiScore || lead.score || 0,
    ai_score: resolvedQualification?.aiScore || lead.ai_score || null,
    ai_reasoning: resolvedQualification?.reasoning || lead.ai_reasoning || null,
    estimated_deal_value: resolvedQualification?.estimatedDealValue || lead.estimated_deal_value || null,
    social_profiles: resolvedQualification?.socialProfiles || analysis?.socialProfiles || lead.social_profiles || {},
    tech_stack: resolvedQualification?.techStack || analysis?.techStack || lead.tech_stack || [],
    email: resolvedQualification?.email || lead.email || null,
    contact_name: resolvedQualification?.contactName || lead.contact_name || null,
    role: resolvedQualification?.role || lead.role || null,
    maps_url: lead.maps_url || null,
    business_status: lead.business_status || null,
    raw_payload: {
      original: leadInput,
      analysis: analysis || null,
    },
    data: {
      original: leadInput,
      analysis: analysis || null,
    },
  };
}

export async function upsertProspectorLead({
  userId,
  leadInput,
  scanId,
  source,
  analysis,
  qualification,
}: {
  userId: string | null | undefined;
  leadInput: Record<string, unknown>;
  scanId?: string | null;
  source?: string | null;
  analysis?: WebsiteAnalysis | null;
  qualification?: Awaited<ReturnType<typeof qualifyLead>> | null;
}) {
  const existing = await findExistingProspectorLead(userId, leadInput);
  const payload = buildProspectorLeadRow({
    userId,
    leadInput,
    scanId,
    source,
    analysis,
    qualification,
  });

  if (existing) {
    payload.status = preserveLeadStatus(payload.status, compact(existing.status) || null);

    const { data, error } = await admin
      .from("prospector_leads")
      .update({
        ...payload,
        company_id: existing.company_id || null,
        contact_id: existing.contact_id || null,
        deal_id: existing.deal_id || null,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data as Record<string, unknown>;
  }

  const { data, error } = await admin
    .from("prospector_leads")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as Record<string, unknown>;
}

export async function persistProspectorScan({
  userId,
  query,
  location,
  radius,
  source,
  area,
  searchCenter,
  results,
  rawPayload,
}: {
  userId: string | null | undefined;
  query: string;
  location?: string | null;
  radius?: number | null;
  source?: string | null;
  area?: Record<string, unknown> | null;
  searchCenter?: Record<string, unknown> | null;
  results: Array<Record<string, unknown>>;
  rawPayload?: Record<string, unknown> | null;
}) {
  const { data: scan, error: scanError } = await admin
    .from("prospector_scans")
    .insert({
      user_id: userId || null,
      query,
      location: location || area?.formatted_address || area?.label || null,
      radius: radius || null,
      results_count: results.length,
      status: "completed",
      source: source || "atlas",
      area_label: compact(area?.label) || compact(location) || null,
      area: area || {},
      search_center: searchCenter || {},
      raw_payload: rawPayload || {},
      data: rawPayload || {},
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (scanError) throw scanError;

  const leads = [];
  for (const result of results) {
    const persisted = await upsertProspectorLead({
      userId,
      leadInput: result,
      scanId: scan.id,
      source: source || "atlas",
    });
    leads.push(persisted);
  }

  return { scan, leads };
}
