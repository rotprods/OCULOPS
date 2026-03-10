import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { api, endpoint, method = 'GET', body = null, params = {} } = await req.json()

    if (!api || !endpoint) {
      throw new Error('Missing required fields: api, endpoint');
    }

    // Configure known APIs
    let baseUrl = '';
    const fetchHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    switch (api) {
      case 'coingecko':
        baseUrl = 'https://api.coingecko.com/api/v3';
        break;
      case 'genderize':
        baseUrl = 'https://api.genderize.io';
        break;
      case 'agify':
        baseUrl = 'https://api.agify.io';
        break;
      case 'nationalize':
        baseUrl = 'https://api.nationalize.io';
        break;
      case 'randomuser':
        baseUrl = 'https://randomuser.me/api';
        break;
      case 'universities':
        baseUrl = 'http://universities.hipolabs.com';
        break;
      default:
        throw new Error(`Unsupported public API: ${api}`);
    }

    // Append query params if provided
    let urlString = `${baseUrl}${endpoint}`;
    if (Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      const separator = urlString.includes('?') ? '&' : '?';
      urlString += `${separator}${searchParams.toString()}`;
    }

    console.log(`[ApiHarness] Proxying request to: ${method} ${urlString}`);

    const fetchOptions: RequestInit = {
      method,
      headers: fetchHeaders,
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(urlString, fetchOptions);

    // Attempt to parse JSON response. If fail, return text.
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return new Response(JSON.stringify({
      success: response.ok,
      status: response.status,
      data: data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.status,
    })

  } catch (error: any) {
    console.error(`[ApiHarness Error] ${error.message}`);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
