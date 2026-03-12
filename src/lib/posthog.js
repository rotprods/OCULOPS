// OCULOPS — PostHog Product Analytics
// Initialize in main.jsx BEFORE React renders

import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY

export function initPostHog() {
  if (!POSTHOG_KEY) {
    console.warn('[PostHog] No key configured — analytics disabled')
    return
  }

  posthog.init(POSTHOG_KEY, {
    api_host: 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false, // manual events only — avoid noise
    disable_session_recording: import.meta.env.DEV,
    loaded(ph) {
      if (import.meta.env.DEV) ph.opt_out_capturing()
    },
  })
}

export function identifyUser(userId, traits = {}) {
  if (!POSTHOG_KEY) return
  posthog.identify(userId, traits)
}

export function trackEvent(event, properties = {}) {
  if (!POSTHOG_KEY) return
  posthog.capture(event, properties)
}

export function resetUser() {
  if (!POSTHOG_KEY) return
  posthog.reset()
}

export { posthog }
