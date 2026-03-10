import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const VEO_API_URL = Deno.env.get('VEO_API_URL') || 'https://api.veo.co/v3/generate'
const VEO_API_KEY = Deno.env.get('VEO_API_KEY')

serve(async (req) => {
    // 1. Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 2. Validate Authorization (JWT from Supabase client)
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing Authorization header')
        }

        // 3. Parse user request
        const body = await req.json()
        const { prompt, options = {} } = body

        if (!prompt) {
            throw new Error('Missing "prompt" in request body')
        }

        if (!VEO_API_KEY) {
            console.warn('VEO_API_KEY is not set. Mocking response for testing.')
            // Return a simulated mock response if API keys are not yet configured
            return new Response(JSON.stringify({
                status: 'success',
                mediaUrl: 'https://storage.googleapis.com/antigravity-mock/mock-video-veo.mp4',
                message: 'Mocked successful Veo3 response due to missing API key.'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // 4. Proxy to Veo 3 API
        const veoReq = await fetch(VEO_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VEO_API_KEY}`
            },
            body: JSON.stringify({
                prompt: prompt,
                ...options
            })
        })

        const veoRes = await veoReq.json()

        // 5. Return payload to client
        return new Response(JSON.stringify(veoRes), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: veoReq.status,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
