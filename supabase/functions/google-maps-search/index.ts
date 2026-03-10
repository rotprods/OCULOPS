// ═══════════════════════════════════════════════════
// Edge Function: Google Maps Business Search
// Detects potential leads via Google Maps Places API
// ═══════════════════════════════════════════════════

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CITY_PRESETS: Record<string, { lat: number; lng: number; label: string; city: string; country: string }> = {
    madrid: { lat: 40.4168, lng: -3.7038, label: "Madrid, Spain", city: "Madrid", country: "Spain" },
    murcia: { lat: 37.9922, lng: -1.1307, label: "Murcia, Spain", city: "Murcia", country: "Spain" },
    barcelona: { lat: 41.3874, lng: 2.1686, label: "Barcelona, Spain", city: "Barcelona", country: "Spain" },
    valencia: { lat: 39.4699, lng: -0.3763, label: "Valencia, Spain", city: "Valencia", country: "Spain" },
    paris: { lat: 48.8566, lng: 2.3522, label: "Paris, France", city: "Paris", country: "France" },
    london: { lat: 51.5074, lng: -0.1278, label: "London, United Kingdom", city: "London", country: "United Kingdom" },
    berlin: { lat: 52.52, lng: 13.405, label: "Berlin, Germany", city: "Berlin", country: "Germany" },
    newyork: { lat: 40.7128, lng: -74.006, label: "New York, United States", city: "New York", country: "United States" },
    miami: { lat: 25.7617, lng: -80.1918, label: "Miami, United States", city: "Miami", country: "United States" },
};

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

function normalizeLocationKey(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseCoordinateLocation(location?: string) {
    if (!location) return null;
    const match = location.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
    if (!match) return null;

    return {
        lat: Number(match[1]),
        lng: Number(match[3]),
        label: `${Number(match[1]).toFixed(4)}, ${Number(match[3]).toFixed(4)}`,
    };
}

function presetFromLocation(location?: string) {
    if (!location) return null;
    const normalized = normalizeLocationKey(location);
    return Object.entries(CITY_PRESETS).find(([key]) => normalized.includes(key))?.[1] ?? null;
}

async function reverseGeocode(lat: number, lng: number, fallbackLabel: string) {
    if (!GOOGLE_MAPS_API_KEY) {
        const preset = Object.values(CITY_PRESETS).find(city =>
            Math.abs(city.lat - lat) < 0.7 && Math.abs(city.lng - lng) < 0.7
        );

        return {
            label: preset?.label || fallbackLabel,
            city: preset?.city || null,
            region: null,
            country: preset?.country || null,
            formatted_address: preset?.label || fallbackLabel,
        };
    }

    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("latlng", `${lat},${lng}`);
    url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK" || !data.results?.length) {
        return {
            label: fallbackLabel,
            city: null,
            region: null,
            country: null,
            formatted_address: fallbackLabel,
        };
    }

    const result = data.results[0];
    const components = result.address_components || [];
    const findComponent = (type: string) =>
        components.find((component: { types: string[] }) => component.types.includes(type))?.long_name || null;

    const city = findComponent("locality") || findComponent("postal_town") || findComponent("administrative_area_level_2");
    const region = findComponent("administrative_area_level_1");
    const country = findComponent("country");

    return {
        label: [city, region, country].filter(Boolean).join(", ") || result.formatted_address || fallbackLabel,
        city,
        region,
        country,
        formatted_address: result.formatted_address || fallbackLabel,
    };
}

async function resolveCenter(body: Record<string, unknown>) {
    const lat = typeof body.lat === "number" ? body.lat : null;
    const lng = typeof body.lng === "number" ? body.lng : null;
    if (lat != null && lng != null) {
        const area = await reverseGeocode(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        return { lat, lng, area, label: area.label };
    }

    const locationString = typeof body.location === "string" ? body.location : undefined;
    const parsedLocation = parseCoordinateLocation(locationString);
    if (parsedLocation) {
        const area = await reverseGeocode(parsedLocation.lat, parsedLocation.lng, parsedLocation.label);
        return { lat: parsedLocation.lat, lng: parsedLocation.lng, area, label: area.label };
    }

    const preset = presetFromLocation(locationString);
    if (preset) {
        const area = await reverseGeocode(preset.lat, preset.lng, preset.label);
        return { lat: preset.lat, lng: preset.lng, area, label: area.label };
    }

    if (!locationString || !GOOGLE_MAPS_API_KEY) {
        const fallback = CITY_PRESETS.madrid;
        const area = await reverseGeocode(fallback.lat, fallback.lng, fallback.label);
        return { lat: fallback.lat, lng: fallback.lng, area, label: area.label };
    }

    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", locationString);
    url.searchParams.set("key", GOOGLE_MAPS_API_KEY);
    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK" || !data.results?.length) {
        throw new Error("Unable to resolve location");
    }

    const result = data.results[0];
    const { lat: resolvedLat, lng: resolvedLng } = result.geometry.location;
    const area = await reverseGeocode(resolvedLat, resolvedLng, result.formatted_address);
    return {
        lat: resolvedLat,
        lng: resolvedLng,
        area,
        label: area.label,
    };
}

function buildDemoPlaces(center: Awaited<ReturnType<typeof resolveCenter>>, query: string, maxResults: number) {
    const seedSource = `${query}-${center.lat.toFixed(4)}-${center.lng.toFixed(4)}`;
    let seed = Array.from(seedSource).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const nextRandom = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };

    const verticals = ["Studio", "Collective", "Hub", "Lab", "Works", "Partners", "Club", "House"];
    const category = query || "business";
    const areaName = center.area.city || center.area.country || "Target Zone";

    return Array.from({ length: Math.min(maxResults, 12) }, (_, index) => {
        const angle = nextRandom() * Math.PI * 2;
        const distanceKm = 0.8 + nextRandom() * 4.6;
        const latOffset = (Math.cos(angle) * distanceKm) / 111.32;
        const lngOffset = (Math.sin(angle) * distanceKm) / (111.32 * Math.max(Math.cos((center.lat * Math.PI) / 180), 0.25));
        const hasWebsite = nextRandom() > 0.45;
        const rating = Number((3.5 + nextRandom() * 1.4).toFixed(1));

        return {
            id: `demo-${index + 1}`,
            place_id: `demo-${index + 1}`,
            google_maps_id: `demo-${index + 1}`,
            name: `${areaName} ${verticals[index % verticals.length]}`,
            business_name: `${areaName} ${verticals[index % verticals.length]}`,
            address: `${12 + index} ${category} avenue`,
            location: `${12 + index} ${category} avenue`,
            lat: Number((center.lat + latOffset).toFixed(6)),
            lng: Number((center.lng + lngOffset).toFixed(6)),
            category,
            phone: null,
            website: hasWebsite ? `https://${areaName.toLowerCase().replace(/[^a-z0-9]+/g, "")}${index + 1}.example.com` : null,
            website_url: hasWebsite ? `https://${areaName.toLowerCase().replace(/[^a-z0-9]+/g, "")}${index + 1}.example.com` : null,
            has_website: hasWebsite,
            rating,
            review_count: Math.floor(10 + nextRandom() * 240),
            source: "google_maps_demo",
            status: "detected",
            business_status: "OPERATIONAL",
        };
    });
}

function normalizeLivePlace(place: Record<string, unknown>, detail: Record<string, unknown>, category: string) {
    const geometry = place.geometry as { location?: { lat?: number; lng?: number } } | undefined;
    const position = geometry?.location || {};
    const website = typeof detail.website === "string" ? detail.website : null;
    const address = typeof detail.formatted_address === "string"
        ? detail.formatted_address
        : typeof place.vicinity === "string"
            ? place.vicinity
            : "";

    return {
        id: typeof place.place_id === "string" ? place.place_id : crypto.randomUUID(),
        place_id: typeof place.place_id === "string" ? place.place_id : null,
        google_maps_id: typeof place.place_id === "string" ? place.place_id : null,
        name: typeof detail.name === "string" ? detail.name : typeof place.name === "string" ? place.name : "Unknown",
        business_name: typeof detail.name === "string" ? detail.name : typeof place.name === "string" ? place.name : "Unknown",
        address,
        location: address,
        lat: typeof position.lat === "number" ? position.lat : null,
        lng: typeof position.lng === "number" ? position.lng : null,
        category,
        phone: typeof detail.formatted_phone_number === "string" ? detail.formatted_phone_number : null,
        website,
        website_url: website,
        has_website: Boolean(website),
        rating: typeof detail.rating === "number" ? detail.rating : typeof place.rating === "number" ? place.rating : null,
        review_count: typeof detail.user_ratings_total === "number"
            ? detail.user_ratings_total
            : typeof place.user_ratings_total === "number"
                ? place.user_ratings_total
                : 0,
        maps_url: typeof detail.url === "string" ? detail.url : null,
        source: "google_maps",
        status: "detected",
        business_status: typeof detail.business_status === "string" ? detail.business_status : null,
    };
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const body = await req.json();
        const query = typeof body.query === "string" ? body.query : typeof body.keyword === "string" ? body.keyword : "business";
        const radius = typeof body.radius === "number" ? body.radius : Number(body.radius || 5000);
        const maxResults = typeof body.maxResults === "number" ? body.maxResults : Number(body.maxResults ?? 20);
        const resolveOnly = Boolean(body.resolve_only || body.resolveOnly);
        const center = await resolveCenter(body);

        if (resolveOnly) {
            return jsonResponse({
                mode: GOOGLE_MAPS_API_KEY ? "resolve" : "demo-resolve",
                total: 0,
                without_website: 0,
                leads: [],
                with_website: [],
                places: [],
                area: center.area,
                search_center: { lat: center.lat, lng: center.lng, label: center.label },
            });
        }

        if (!GOOGLE_MAPS_API_KEY) {
            const places = buildDemoPlaces(center, query, maxResults);
            const leadsWithoutWebsite = places.filter((place) => !place.has_website);
            const leadsWithWebsite = places.filter((place) => place.has_website);

            return jsonResponse({
                mode: "demo",
                total: places.length,
                without_website: leadsWithoutWebsite.length,
                leads: leadsWithoutWebsite,
                with_website: leadsWithWebsite,
                places,
                area: center.area,
                search_center: { lat: center.lat, lng: center.lng, label: center.label },
            });
        }

        // Step 1: Search nearby places
        const searchUrl = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
        searchUrl.searchParams.set("location", `${center.lat},${center.lng}`);
        searchUrl.searchParams.set("radius", String(radius || 5000));
        searchUrl.searchParams.set("type", typeof body.type === "string" ? body.type : "establishment");
        if (query) searchUrl.searchParams.set("keyword", query);
        searchUrl.searchParams.set("key", GOOGLE_MAPS_API_KEY);

        const searchRes = await fetch(searchUrl.toString());
        const searchData = await searchRes.json();

        if (searchData.status === "ZERO_RESULTS") {
            return jsonResponse({
                mode: "live",
                total: 0,
                without_website: 0,
                leads: [],
                with_website: [],
                places: [],
                area: center.area,
                search_center: { lat: center.lat, lng: center.lng, label: center.label },
            });
        }

        if (searchData.status !== "OK") {
            console.error("[google-maps-search] API error:", searchData.status, searchData.error_message);
            return jsonResponse({ error: "Search failed" }, 400);
        }

        // Step 2: Get details for each place (check for website)
        const results = [];
        const places = searchData.results.slice(0, Math.max(0, maxResults));

        for (const place of places) {
            const detailUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
            detailUrl.searchParams.set("place_id", place.place_id);
            detailUrl.searchParams.set("fields", "name,formatted_address,website,formatted_phone_number,types,business_status,url,rating,user_ratings_total");
            detailUrl.searchParams.set("key", GOOGLE_MAPS_API_KEY);

            const detailRes = await fetch(detailUrl.toString());
            const detailData = await detailRes.json();

            if (detailData.status === "OK") {
                const detail = detailData.result;
                results.push(
                    normalizeLivePlace(
                        place,
                        detail,
                        Array.isArray(detail.types) && detail.types.length > 0
                            ? detail.types.join(", ")
                            : query
                    )
                );
            }
        }

        // Step 3: Filter for leads without websites (highest potential)
        const leadsWithoutWebsite = results.filter((r) => !r.has_website);
        const leadsWithWebsite = results.filter((r) => r.has_website);

        return jsonResponse({
            mode: "live",
            total: results.length,
            without_website: leadsWithoutWebsite.length,
            leads: leadsWithoutWebsite,
            with_website: leadsWithWebsite,
            places: results,
            area: center.area,
            search_center: { lat: center.lat, lng: center.lng, label: center.label },
        });
    } catch (err) {
        console.error("[google-maps-search] error:", err);
        return jsonResponse({ error: err instanceof Error ? err.message : "Internal server error" }, 500);
    }
});
