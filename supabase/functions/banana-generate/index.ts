import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/http.ts'

const BANANA_API_URL = Deno.env.get('BANANA_API_URL') || 'https://api.banana.dev/start/v4/'
const BANANA_API_KEY = Deno.env.get('BANANA_API_KEY')
const BANANA_MODEL_KEY = Deno.env.get('BANANA_MODEL_KEY')

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
        const { prompt, modelInputs = {} } = body

        if (!prompt) {
            throw new Error('Missing "prompt" in request body')
        }

        if (!BANANA_API_KEY || !BANANA_MODEL_KEY) {
            console.warn('BANANA_API_KEY or BANANA_MODEL_KEY is not set. Mocking response for testing.')
            // Return a simulated mock response if API keys are not yet configured
            return new Response(JSON.stringify({
                status: 'success',
                mediaUrl: 'https://storage.googleapis.com/oculops-mock/mock-image-banana.png',
                message: 'Mocked successful Nano Banana response due to missing API key.'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // 4. Proxy to Nano Banana API
        const bananaReq = await fetch(BANANA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: BANANA_API_KEY,
                modelKey: BANANA_MODEL_KEY,
                modelInputs: {
                    prompt: prompt,
                    ...modelInputs
                }
            })
        })

        const bananaRes = await bananaReq.json()

        // 5. Return payload to client
        return new Response(JSON.stringify(bananaRes), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: bananaReq.status,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
