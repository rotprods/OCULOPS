const CHANNEL_LABELS = {
    email: 'Gmail',
    whatsapp: 'WhatsApp',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
}

function compact(value) {
    return value == null ? '' : String(value).trim()
}

function safeEncode(value) {
    return encodeURIComponent(compact(value))
}

function firstName(name) {
    return compact(name).split(/\s+/)[0] || 'equipo'
}

function getCompanyName(company, lead) {
    return compact(company?.name) || compact(lead?.name) || 'tu negocio'
}

function getLocationLabel(company, lead, context = {}) {
    return compact(context.areaLabel) || compact(company?.location) || compact(lead?.address) || compact(context.location) || 'tu zona'
}

function getInsight(lead) {
    if (!lead) return 'hay margen claro para automatizar captación y seguimiento comercial.'
    if (!lead.website) return 'he visto que todavía no tienes una web activa y ahí hay una oportunidad inmediata de captación.'
    if ((lead.review_count || 0) > 120) return 'ya tienes demanda validada y se puede convertir mejor con automatización comercial.'
    if ((lead.rating || 0) >= 4.5) return 'la reputación es fuerte y eso permite escalar outreach y cierres con mejor conversión.'
    return 'hay margen claro para automatizar captación y seguimiento comercial.'
}

function getLinkedInUrl(contact, company) {
    if (compact(contact?.linkedin_url)) return contact.linkedin_url
    const query = [contact?.name, company?.name].filter(Boolean).join(' ')
    return `https://www.linkedin.com/search/results/all/?keywords=${safeEncode(query)}`
}

function getInstagramUrl(contact, company) {
    const lookup = compact(contact?.instagram_url) || compact(contact?.instagram_handle) || compact(company?.instagram_url)
    if (lookup.startsWith('http')) return lookup
    if (lookup.startsWith('@')) return `https://www.instagram.com/${lookup.slice(1)}/`
    if (lookup) return `https://www.instagram.com/${lookup.replace(/^@/, '')}/`
    return `https://www.instagram.com/explore/search/keyword/?q=${safeEncode(company?.name || contact?.name || '')}`
}

export function getChannelLabel(channel) {
    return CHANNEL_LABELS[channel] || channel
}

export function buildChannelDraft(channel, { contact, company, lead, subject, body, context = {} }) {
    const recipientName = firstName(contact?.name || lead?.name)
    const companyName = getCompanyName(company, lead)
    const area = getLocationLabel(company, lead, context)
    const insight = getInsight(lead)

    const defaultSubject = `Idea rápida para ${companyName}`
    const defaultBody = {
        email: [
            `Hola ${recipientName},`,
            '',
            `He estado analizando ${companyName} en ${area} con Atlas y ${insight}`,
            'Trabajo montando sistemas de captación y seguimiento con IA para convertir mejor el tráfico y los leads sin añadir carga manual.',
            'Si tiene sentido, te enseño en 10 minutos qué automatizar primero y cuánto impacto podría tener.',
            '',
            'Un saludo,',
            'Roberto',
        ].join('\n'),
        whatsapp: `Hola ${recipientName}, soy Roberto. He revisado ${companyName} en ${area} con Atlas y ${insight} Si quieres, te paso por aquí 2 ideas concretas para automatizar captación y seguimiento.`,
        linkedin: `Hola ${recipientName}, acabo de revisar ${companyName} con Atlas y veo una oportunidad clara para automatizar captación y seguimiento. Si te encaja, te comparto 2 ideas concretas por aquí.`,
        instagram: `Hola ${recipientName}, he analizado ${companyName} con Atlas y veo una oportunidad muy clara para automatizar captación y seguimiento. Si quieres, te mando por aquí 2 ideas rápidas.`,
    }

    const resolvedSubject = compact(subject) || defaultSubject
    const resolvedBody = compact(body) || defaultBody[channel] || defaultBody.email

    return {
        channel,
        subject: resolvedSubject,
        body: resolvedBody,
        launchUrl: buildLaunchUrl(channel, {
            contact,
            company,
            lead,
            subject: resolvedSubject,
            body: resolvedBody,
        }),
    }
}

export function buildLaunchUrl(channel, { contact, company, lead, subject, body }) {
    if (channel === 'email') {
        return `https://mail.google.com/mail/?view=cm&fs=1&to=${safeEncode(contact?.email || '')}&su=${safeEncode(subject)}&body=${safeEncode(body)}`
    }

    if (channel === 'whatsapp') {
        const normalizedPhone = compact(contact?.phone || lead?.phone).replace(/[^\d]/g, '')
        return `https://wa.me/${normalizedPhone}?text=${safeEncode(body)}`
    }

    if (channel === 'linkedin') {
        return getLinkedInUrl(contact, company)
    }

    if (channel === 'instagram') {
        return getInstagramUrl(contact, company)
    }

    return null
}
