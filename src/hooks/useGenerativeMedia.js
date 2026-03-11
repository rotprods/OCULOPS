import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useGenerativeMedia() {
    const [isGeneratingVFX, setIsGeneratingVFX] = useState(false)
    const [isGeneratingImage, setIsGeneratingImage] = useState(false)
    const [isGeneratingCopy, setIsGeneratingCopy] = useState(false)
    const [error, setError] = useState(null)

    const generateVideo = useCallback(async (prompt, options = {}) => {
        setIsGeneratingVFX(true)
        setError(null)
        try {
            const { data, error: fnError } = await supabase.functions.invoke('veo-generate', {
                body: { prompt, options }
            })

            if (fnError) throw fnError

            return { ...data, url: data?.url ?? data?.output ?? data?.mediaUrl ?? null }
        } catch (err) {
            if (import.meta.env.DEV) console.error('Failed to generate Veo3 Video:', err)
            setError(err.message)
            throw err
        } finally {
            setIsGeneratingVFX(false)
        }
    }, [])

    const generateImage = useCallback(async (prompt, modelInputs = {}) => {
        setIsGeneratingImage(true)
        setError(null)
        try {
            const { data, error: fnError } = await supabase.functions.invoke('banana-generate', {
                body: { prompt, modelInputs }
            })

            if (fnError) throw fnError

            return { ...data, url: data?.url ?? data?.output ?? data?.mediaUrl ?? null }
        } catch (err) {
            if (import.meta.env.DEV) console.error('Failed to generate Nano Banana Image:', err)
            setError(err.message)
            throw err
        } finally {
            setIsGeneratingImage(false)
        }
    }, [])

    const generateCopy = useCallback(async (topic, contentType = 'social_post') => {
        setIsGeneratingCopy(true)
        setError(null)
        try {
            const { data, error: fnError } = await supabase.functions.invoke('agent-forge', {
                body: { action: 'generate', content_type: contentType, topic }
            })
            if (fnError) throw fnError
            return data?.result ?? data
        } catch (err) {
            if (import.meta.env.DEV) console.error('Failed to generate FORGE copy:', err)
            setError(err.message)
            throw err
        } finally {
            setIsGeneratingCopy(false)
        }
    }, [])

    return {
        generateVideo,
        generateImage,
        generateCopy,
        isGeneratingVFX,
        isGeneratingImage,
        isGeneratingCopy,
        error
    }
}
