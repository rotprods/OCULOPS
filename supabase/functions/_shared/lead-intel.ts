import { compact, safeNumber } from "./http.ts";

export interface NormalizedLead {
  id?: string | null;
  place_id?: string | null;
  google_maps_id?: string | null;
  name?: string | null;
  business_name?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  website?: string | null;
  category?: string | null;
  rating?: number | null;
  review_count?: number | null;
  reviews_count?: number | null;
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  source?: string | null;
  status?: string | null;
  score?: number | null;
  ai_score?: number | null;
  maps_url?: string | null;
  business_status?: string | null;
  social_profiles?: Record<string, string>;
  tech_stack?: string[];
  email?: string | null;
  role?: string | null;
  contact_name?: string | null;
  ai_reasoning?: string | null;
  estimated_deal_value?: number | null;
}

export interface WebsiteAnalysis {
  website: string;
  hostname: string | null;
  title: string | null;
  description: string | null;
  emails: string[];
  socialProfiles: Record<string, string>;
  techStack: string[];
  formsCount: number;
  ctaCount: number;
  bookingLinks: string[];
  snippet: string;
  pageSignals: string[];
}

export interface LeadQualification {
  aiScore: number;
  estimatedDealValue: number;
  status: string;
  reasoning: string;
  socialProfiles: Record<string, string>;
  techStack: string[];
  email: string | null;
  role: string | null;
  contactName: string | null;
  signals: string[];
}

const TECH_RULES = [
  { label: "WordPress", match: /wp-content|wordpress/i },
  { label: "Shopify", match: /cdn\.shopify\.com|shopify/i },
  { label: "Wix", match: /wixstatic\.com|_wixCssrules/i },
  { label: "Squarespace", match: /static\.squarespace\.com|squarespace/i },
  { label: "Webflow", match: /webflow\.js|webflow/i },
  { label: "React", match: /react|__next|data-reactroot/i },
  { label: "Next.js", match: /_next\/static|__NEXT_DATA__/i },
  { label: "Vue", match: /vue(?:\.js)?|data-v-/i },
  { label: "Google Analytics", match: /gtag\(|google-analytics|googletagmanager/i },
  { label: "Meta Pixel", match: /fbq\(|connect\.facebook\.net/i },
  { label: "Hotjar", match: /hotjar/i },
  { label: "HubSpot", match: /hs-scripts\.com|hubspot/i },
  { label: "Intercom", match: /intercom/i },
  { label: "Calendly", match: /calendly/i },
  { label: "Tawk", match: /tawk\.to/i },
];

const SOCIAL_RULES = [
  { key: "instagram", match: /https?:\/\/(?:www\.)?instagram\.com\/[^\s"'?#]+/gi },
  { key: "linkedin", match: /https?:\/\/(?:[\w]+\.)?linkedin\.com\/[^\s"'?#]+/gi },
  { key: "facebook", match: /https?:\/\/(?:www\.)?facebook\.com\/[^\s"'?#]+/gi },
  { key: "tiktok", match: /https?:\/\/(?:www\.)?tiktok\.com\/[^\s"'?#]+/gi },
  { key: "youtube", match: /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s"'?#]+/gi },
];

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function normalizeWebsite(url: string) {
  const trimmed = compact(url);
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function normalizeLead(lead: Record<string, unknown>) {
  const website = normalizeWebsite(compact(lead.website || lead["website_url"])) || null;
  const reviewCount = lead.review_count ?? lead.reviews_count ?? lead["user_ratings_total"];

  return {
    id: compact(lead.id) || null,
    place_id: compact(lead.place_id) || compact(lead.google_maps_id) || null,
    google_maps_id: compact(lead.google_maps_id) || compact(lead.place_id) || null,
    name: compact(lead.name) || compact(lead.business_name) || null,
    business_name: compact(lead.business_name) || compact(lead.name) || null,
    address: compact(lead.address) || compact(lead.location) || null,
    city: compact(lead.city) || null,
    phone: compact(lead.phone) || null,
    website,
    category: compact(lead.category) || compact(lead.primary_type) || null,
    rating: lead.rating == null ? null : safeNumber(lead.rating, 0),
    review_count: reviewCount == null ? 0 : safeNumber(reviewCount, 0),
    lat: lead.lat == null ? safeNumber(lead.latitude, NaN) : safeNumber(lead.lat, NaN),
    lng: lead.lng == null ? safeNumber(lead.longitude, NaN) : safeNumber(lead.lng, NaN),
    source: compact(lead.source) || "google_maps",
    status: compact(lead.status) || "detected",
    score: lead.score == null ? null : safeNumber(lead.score, 0),
    ai_score: lead.ai_score == null ? null : safeNumber(lead.ai_score, 0),
    maps_url: compact(lead.maps_url) || compact(lead.url) || null,
    business_status: compact(lead.business_status) || null,
    social_profiles: (lead.social_profiles as Record<string, string>) || {},
    tech_stack: Array.isArray(lead.tech_stack) ? lead.tech_stack.map(item => compact(item)).filter(Boolean) : [],
    email: compact(lead.email) || null,
    role: compact(lead.role) || null,
    contact_name: compact(lead.contact_name) || null,
    ai_reasoning: compact(lead.ai_reasoning) || null,
    estimated_deal_value: lead.estimated_deal_value == null ? null : safeNumber(lead.estimated_deal_value, 0),
  } as NormalizedLead;
}

function extractFirstMatch(pattern: RegExp, html: string) {
  const match = html.match(pattern);
  return match?.[1]?.trim() || null;
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEmails(html: string, hostname: string | null) {
  const candidates = [
    ...(html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []),
  ].map(email => email.toLowerCase());

  if (hostname && candidates.length === 0) {
    const baseDomain = hostname.replace(/^www\./i, "");
    candidates.push(`info@${baseDomain}`, `hello@${baseDomain}`);
  }

  return unique(candidates.filter(Boolean)).slice(0, 5);
}

function extractSocialProfiles(html: string) {
  return SOCIAL_RULES.reduce<Record<string, string>>((acc, rule) => {
    const match = html.match(rule.match);
    if (match?.[0]) acc[rule.key] = match[0];
    return acc;
  }, {});
}

function detectTechStack(html: string) {
  return unique(
    TECH_RULES
      .filter(rule => rule.match.test(html))
      .map(rule => rule.label),
  );
}

function detectBookingLinks(html: string) {
  return unique([
    ...(html.match(/https?:\/\/[^\s"'<>]*(?:calendly|booksy|treatwell|simplybook)\.[^\s"'<>]*/gi) || []),
  ]).slice(0, 5);
}

function buildPageSignals(html: string, analysis: WebsiteAnalysis) {
  const signals: string[] = [];

  if (analysis.formsCount === 0) signals.push("No visible forms");
  if (analysis.ctaCount <= 1) signals.push("Low CTA density");
  if (analysis.techStack.includes("WordPress")) signals.push("WordPress site");
  if (analysis.techStack.includes("Shopify")) signals.push("Shopify stack");
  if (analysis.socialProfiles.instagram) signals.push("Instagram linked");
  if (analysis.bookingLinks.length > 0) signals.push("Booking flow detected");
  if (!analysis.description) signals.push("Missing meta description");
  if (analysis.emails.length > 0) signals.push("Contact email detected");

  return signals;
}

export function analyzeWebsiteMarkup(website: string, html: string): WebsiteAnalysis {
  const normalized = normalizeWebsite(website) || website;
  let hostname: string | null = null;

  try {
    hostname = new URL(normalized).hostname;
  } catch {
    hostname = null;
  }

  const title = extractFirstMatch(/<title[^>]*>([\s\S]*?)<\/title>/i, html);
  const description = extractFirstMatch(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i, html)
    || extractFirstMatch(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i, html);
  const formsCount = (html.match(/<form\b/gi) || []).length;
  const ctaCount = (html.match(/(?:reservar|book now|contacta|solicita|demo|llámanos|escríbenos)/gi) || []).length;
  const emails = extractEmails(html, hostname);
  const socialProfiles = extractSocialProfiles(html);
  const techStack = detectTechStack(html);
  const bookingLinks = detectBookingLinks(html);
  const snippet = stripHtml(html).slice(0, 420);

  const analysis: WebsiteAnalysis = {
    website: normalized,
    hostname,
    title,
    description,
    emails,
    socialProfiles,
    techStack,
    formsCount,
    ctaCount,
    bookingLinks,
    snippet,
    pageSignals: [],
  };

  analysis.pageSignals = buildPageSignals(html, analysis);
  return analysis;
}

function inferRoleFromEmail(email: string | null) {
  const normalized = compact(email).toLowerCase();
  if (!normalized) return null;
  if (/(owner|founder|ceo|director)/.test(normalized)) return "Owner";
  if (/(ventas|sales)/.test(normalized)) return "Sales";
  if (/(marketing|growth)/.test(normalized)) return "Marketing";
  if (/(hello|hola|info|contact)/.test(normalized)) return "Front Desk";
  return "Owner / Front Desk";
}

function buildReasoning(signals: string[], score: number, lead: NormalizedLead, analysis?: WebsiteAnalysis | null) {
  const reasons = [...signals];

  if (lead.website) reasons.push("Website available for outreach and optimization");
  else reasons.push("No website detected, high automation opportunity");

  if ((lead.review_count || 0) >= 100) reasons.push("Strong market demand confirmed by reviews");
  else if ((lead.review_count || 0) > 15) reasons.push("Some traction already visible");

  if ((lead.rating || 0) >= 4.5) reasons.push("High customer satisfaction signal");
  if (analysis?.bookingLinks.length) reasons.push("Booking workflow detected");
  if (analysis?.socialProfiles.instagram || lead.social_profiles?.instagram) reasons.push("Social presence available");

  return `Score ${score}/100. ${reasons.slice(0, 4).join(". ")}.`;
}

function estimateDealValue(score: number, lead: NormalizedLead, analysis?: WebsiteAnalysis | null) {
  let value = 900;

  if (lead.website) value += 500;
  if ((lead.review_count || 0) >= 50) value += 450;
  if ((lead.review_count || 0) >= 150) value += 350;
  if ((lead.rating || 0) >= 4.5) value += 250;
  if (analysis?.bookingLinks.length) value += 350;
  if ((lead.category || "").match(/clinic|dental|salon|restaurant|gym|hotel/i)) value += 300;
  if (score >= 80) value += 400;

  return Math.round(value / 50) * 50;
}

async function callOpenAIJson<T>(systemPrompt: string, payload: Record<string, unknown>) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const model = Deno.env.get("OPENAI_QUALIFIER_MODEL") || "gpt-4o-mini";

  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(payload) },
        ],
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function qualifyLead(leadInput: Record<string, unknown>, analysis?: WebsiteAnalysis | null) {
  const lead = normalizeLead(leadInput);
  const socialProfiles = {
    ...(lead.social_profiles || {}),
    ...(analysis?.socialProfiles || {}),
  };
  const techStack = unique([...(lead.tech_stack || []), ...(analysis?.techStack || [])]);
  const email = lead.email || analysis?.emails?.[0] || null;
  const signals: string[] = [];

  let score = 32;

  if (lead.website) {
    score += 16;
    signals.push("Website live");
  } else {
    score += 10;
    signals.push("No website detected");
  }

  if ((lead.review_count || 0) >= 15) {
    score += 10;
    signals.push("Visible review volume");
  }
  if ((lead.review_count || 0) >= 100) {
    score += 12;
    signals.push("High review velocity");
  }
  if ((lead.rating || 0) >= 4.2) {
    score += 8;
    signals.push("Strong rating");
  }
  if ((lead.rating || 0) >= 4.6) {
    score += 6;
    signals.push("Premium reputation");
  }
  if (lead.phone) {
    score += 4;
    signals.push("Phone available");
  }
  if (email) {
    score += 7;
    signals.push("Email available");
  }
  if (Object.keys(socialProfiles).length > 0) {
    score += 6;
    signals.push("Social profiles available");
  }
  if (analysis?.formsCount && analysis.formsCount > 0) {
    score += 4;
    signals.push("Lead capture form detected");
  }
  if (analysis?.bookingLinks.length) {
    score += 6;
    signals.push("Booking flow available");
  }
  if (techStack.includes("Meta Pixel") || techStack.includes("Google Analytics")) {
    score += 5;
    signals.push("Tracking stack present");
  }

  score = Math.max(25, Math.min(96, Math.round(score)));

  const estimatedDealValue = estimateDealValue(score, lead, analysis);
  const role = lead.role || inferRoleFromEmail(email);
  let contactName = lead.contact_name || null;

  if (!contactName && role && role !== "Front Desk" && lead.name) {
    contactName = `${lead.name} ${role}`;
  }

  const heuristic: LeadQualification = {
    aiScore: score,
    estimatedDealValue,
    status: score >= 72 ? "qualified" : score >= 52 ? "detected" : "raw",
    reasoning: buildReasoning(signals, score, lead, analysis),
    socialProfiles,
    techStack,
    email,
    role,
    contactName,
    signals,
  };

  const aiResult = await callOpenAIJson<{
    score?: number;
    reasoning?: string;
    status?: string;
    role?: string;
    contact_name?: string;
  }>(
    "You qualify SMB leads for outbound automation. Return JSON only with keys score, reasoning, status, role, contact_name. Keep score from 0 to 100 and status in detected|qualified|pursuing.",
    {
      lead,
      analysis,
      heuristic,
    },
  );

  if (!aiResult) return heuristic;

  return {
    ...heuristic,
    aiScore: aiResult.score == null ? heuristic.aiScore : Math.max(20, Math.min(98, Math.round(aiResult.score))),
    status: compact(aiResult.status) || heuristic.status,
    reasoning: compact(aiResult.reasoning) || heuristic.reasoning,
    role: compact(aiResult.role) || heuristic.role,
    contactName: compact(aiResult.contact_name) || heuristic.contactName,
  };
}

export async function buildStrategicBrief(leadInput: Record<string, unknown>, analysis?: WebsiteAnalysis | null) {
  const lead = normalizeLead(leadInput);
  const qualification = await qualifyLead(lead, analysis);
  const defaultBrief = {
    positioning: `${lead.name || "This business"} shows a ${qualification.aiScore}/100 fit for automation-led outreach.`,
    pain_points: [
      lead.website ? "Lead capture and follow-up can convert more existing demand." : "The business lacks a strong website funnel.",
      (lead.review_count || 0) > 50 ? "High review volume suggests demand that can be monetized better." : "Local demand may need stronger digital acquisition.",
      qualification.socialProfiles.instagram ? "Social demand is present but likely not synchronized with CRM." : "Social and CRM signals are fragmented.",
    ],
    next_steps: [
      "Connect the contact channel into Messaging Hub.",
      "Launch a short outbound sequence with Gmail or WhatsApp.",
      "Sync responses and create a deal pipeline for follow-up.",
    ],
    recommended_channel: lead.phone ? "whatsapp" : "email",
  };

  const aiResult = await callOpenAIJson<{
    positioning?: string;
    pain_points?: string[];
    next_steps?: string[];
    recommended_channel?: string;
  }>(
    "You are a growth strategist for local businesses. Return concise JSON only with positioning, pain_points, next_steps, recommended_channel.",
    {
      lead,
      analysis,
      qualification,
      defaultBrief,
    },
  );

  return {
    ...defaultBrief,
    ...aiResult,
    pain_points: Array.isArray(aiResult?.pain_points) && aiResult?.pain_points.length ? aiResult.pain_points : defaultBrief.pain_points,
    next_steps: Array.isArray(aiResult?.next_steps) && aiResult?.next_steps.length ? aiResult.next_steps : defaultBrief.next_steps,
  };
}
