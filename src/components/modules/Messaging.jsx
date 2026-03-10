// /////////////////////////////////////////////////////////////////////////////
// 100-Year UX: strictly OLED Black, Gold, 1px Primitives
// ANTIGRAVITY OS — Messaging Hub
// Unified inbox backed by conversations/messages in Supabase
// /////////////////////////////////////////////////////////////////////////////

import { useMemo, useState } from 'react'
import { useConversations } from '../../hooks/useConversations'
import { useMessagingChannels } from '../../hooks/useMessagingChannels'
import { useCompanies } from '../../hooks/useCompanies'
import { useAppStore } from '../../stores/useAppStore'
import { buildLaunchUrl, getChannelLabel } from '../../lib/outreach'

const CHANNELS = [
    { key: 'whatsapp', icon: '[ WA ]', label: 'WHATSAPP', color: '#25D366' },
    { key: 'instagram', icon: '[ IG ]', label: 'INSTAGRAM', color: '#E4405F' },
    { key: 'email', icon: '[ MAIL ]', label: 'EMAIL', color: 'var(--color-info)' },
    { key: 'linkedin', icon: '[ IN ]', label: 'LINKEDIN', color: '#0077B5' },
]

const TEMPLATES = [
    { name: 'INTRO', content: 'Hola, he estado analizando vuestra captación y veo dos automatizaciones claras que os podrían ahorrar mucho trabajo comercial.' },
    { name: 'FOLLOW-UP', content: 'Te escribo por si te cuadra que te comparta 2 ideas concretas para automatizar captación y seguimiento.' },
    { name: 'DEMO', content: 'Si te encaja, te enseño en 10 minutos cómo dejar montado el flujo de captación, respuesta y CRM.' },
    { name: 'CLOSING', content: 'Si lo ves alineado, esta semana puedo preparar el setup inicial y dejarlo operativo.' },
]

function inferChannel(conversation, messages = []) {
    if (conversation?.channel?.type) return conversation.channel.type
    if (conversation?.external_id?.includes(':')) return conversation.external_id.split(':')[0]

    const latestWithMetadata = [...messages].reverse().find(message => message.metadata?.channel)
    return latestWithMetadata?.metadata?.channel || 'email'
}

function formatMessageTime(value) {
    if (!value) return ''
    return new Date(value).toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).toUpperCase()
}

function Messaging() {
    const { toast } = useAppStore()
    const { conversations, messages, activeConvo, loading, sendMessage, dispatchMessage, selectConversation, totalUnread } = useConversations()
    const { byType: channelsByType, busy: channelBusy, error: channelsError, connectGmail, connectWhatsApp, disconnectChannel, syncGmail } = useMessagingChannels()
    const { companies } = useCompanies()
    const [activeChannel, setActiveChannel] = useState('all')
    const [messageInput, setMessageInput] = useState('')
    const [showTemplates, setShowTemplates] = useState(false)

    const companyMap = useMemo(
        () => (companies || []).reduce((acc, company) => ({ ...acc, [company.id]: company }), {}),
        [companies]
    )

    const selectedConversation = useMemo(
        () => conversations.find(conversation => conversation.id === activeConvo) || null,
        [activeConvo, conversations]
    )

    const selectedChannel = useMemo(
        () => inferChannel(selectedConversation, messages),
        [messages, selectedConversation]
    )

    const selectedCompany = selectedConversation?.contact?.company_id
        ? companyMap[selectedConversation.contact.company_id]
        : null

    const filteredConversations = useMemo(() => {
        if (activeChannel === 'all') return conversations
        return conversations.filter(conversation => inferChannel(conversation) === activeChannel)
    }, [activeChannel, conversations])

    const draftMessage = useMemo(
        () => [...messages].reverse().find(message => message.metadata?.launch_url),
        [messages]
    )

    const activeTransport = selectedChannel === 'email'
        ? channelsByType.email
        : selectedChannel === 'whatsapp'
            ? channelsByType.whatsapp
            : null

    const canSendRealtime = Boolean(activeTransport && activeTransport.status === 'active')

    const selectConvo = async (conversation) => {
        await selectConversation(conversation.id)
        setMessageInput('')
    }

    const openDraft = (message = draftMessage) => {
        const launchUrl = message?.metadata?.launch_url
        if (!launchUrl) return toast('[ NO LAUNCH URL DETECTED ]', 'warning')
        window.open(launchUrl, '_blank', 'noopener,noreferrer')
    }

    const saveDraft = async ({ openFallback = false } = {}) => {
        if (!messageInput.trim() || !selectedConversation) return

        const launchUrl = buildLaunchUrl(selectedChannel, {
            contact: selectedConversation.contact,
            company: selectedCompany,
            subject: `SEGUIMIENTO · ${selectedCompany?.name || selectedConversation.contact?.name || 'TARGET'}`,
            body: messageInput,
        })

        const message = await sendMessage(selectedConversation.id, messageInput, {
            status: 'draft',
            metadata: {
                channel: selectedChannel,
                launch_url: launchUrl,
                subject: `SEGUIMIENTO · ${selectedCompany?.name || selectedConversation.contact?.name || 'TARGET'}`,
                contact_id: selectedConversation.contact?.id || null,
                company_id: selectedCompany?.id || null,
                company_name: selectedCompany?.name || null,
            },
        })

        if (!message) {
            return toast('[ FAILED TO SECURE DRAFT ]', 'warning')
        }

        if (openFallback && launchUrl) window.open(launchUrl, '_blank', 'noopener,noreferrer')

        setMessageInput('')
        toast(`[ DRAFT SECURED FOR ${getChannelLabel(selectedChannel).toUpperCase()} ]`, 'success')
        return message
    }

    const sendRealtime = async () => {
        if (!messageInput.trim() || !selectedConversation) return
        if (!canSendRealtime) return toast(`[ API OFFLINE: ${getChannelLabel(selectedChannel).toUpperCase()} ]`, 'warning')

        const subject = `SEGUIMIENTO · ${selectedCompany?.name || selectedConversation.contact?.name || 'TARGET'}`
        const launchUrl = buildLaunchUrl(selectedChannel, {
            contact: selectedConversation.contact,
            company: selectedCompany,
            subject,
            body: messageInput,
        })

        const draft = await sendMessage(selectedConversation.id, messageInput, {
            status: 'draft',
            metadata: {
                channel: selectedChannel,
                launch_url: launchUrl,
                subject,
                contact_id: selectedConversation.contact?.id || null,
                company_id: selectedCompany?.id || null,
                company_name: selectedCompany?.name || null,
                email: selectedConversation.contact?.email || null,
                phone: selectedConversation.contact?.phone || null,
            },
        })

        if (!draft) return toast('[ FAILED TO STAGE PAYLOAD ]', 'warning')

        const response = await dispatchMessage({
            messageId: draft.id,
            conversationId: selectedConversation.id,
            channel: selectedChannel,
            subject,
            body: messageInput,
            metadata: {
                launch_url: launchUrl,
            },
        })

        if (response?.error) {
            return toast(`[ TRANSMISSION FAILED: ${response.error} ]`, 'warning')
        }

        setMessageInput('')
        toast(`[ ${getChannelLabel(selectedChannel).toUpperCase()} TRANSMITTED ]`, 'success')
    }

    return (
        <div className="fade-in" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '24px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--text-primary)', fontSize: '28px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>MESSAGING HUB</h1>
                    <p className="mono font-bold" style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '8px', letterSpacing: '0.1em' }}>
                        /// UNIFIED INBOX PROTOCOL: GMAIL API, WHATSAPP API, AND LOCAL DRAFTS
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <div style={{ border: '1px solid var(--border-default)', background: '#000', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                            <div className="mono font-bold" style={{ fontSize: '12px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>[ MAIL ] PROTOCOL</div>
                            <div className="mono font-bold" style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                                {channelsByType.email?.status === 'active'
                                    ? channelsByType.email.email_address || 'API CONNECTED'
                                    : 'AWAITING OAUTH HANDSHAKE'}
                            </div>
                        </div>
                        <div className="mono font-bold" style={{ fontSize: '9px', padding: '4px 8px', letterSpacing: '0.1em', background: channelsByType.email?.status === 'active' ? 'var(--color-success)' : 'transparent', color: channelsByType.email?.status === 'active' ? '#000' : 'var(--text-tertiary)', border: channelsByType.email?.status === 'active' ? 'none' : '1px solid var(--border-subtle)' }}>
                            {channelsByType.email?.status === 'active' ? 'SECURE' : 'OFFLINE'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button className="mono font-bold" style={{ background: 'var(--color-bg-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '9px', padding: '8px 12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }} onClick={connectGmail} disabled={channelBusy === 'gmail'}>
                            {channelBusy === 'gmail' ? '[ ESTABLISHING LINK... ]' : channelsByType.email?.status === 'active' ? '[ RECYCLE LINK ]' : '[ CONNECT API ]'}
                        </button>
                        {channelsByType.email?.status === 'active' && (
                            <>
                                <button className="mono font-bold" style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)', fontSize: '9px', padding: '8px 12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }} onClick={() => syncGmail(channelsByType.email.id)} disabled={channelBusy === `sync:${channelsByType.email.id}`}>
                                    {channelBusy === `sync:${channelsByType.email.id}` ? '[ SYNCING... ]' : '[ FORCE SYNC ]'}
                                </button>
                                <button className="mono font-bold" style={{ background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', fontSize: '9px', padding: '8px 12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }} onClick={() => disconnectChannel(channelsByType.email.id)} disabled={channelBusy === channelsByType.email.id}>
                                    [ SEVER ]
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div style={{ border: '1px solid var(--border-default)', background: '#000', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                            <div className="mono font-bold" style={{ fontSize: '12px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>[ WA ] PROTOCOL</div>
                            <div className="mono font-bold" style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                                {channelsByType.whatsapp?.status === 'active'
                                    ? channelsByType.whatsapp.phone_number || 'CLOUD API CONNECTED'
                                    : 'AWAITING CLOUD API CREDENTIALS'}
                            </div>
                        </div>
                        <div className="mono font-bold" style={{ fontSize: '9px', padding: '4px 8px', letterSpacing: '0.1em', background: channelsByType.whatsapp?.status === 'active' ? 'var(--color-success)' : 'transparent', color: channelsByType.whatsapp?.status === 'active' ? '#000' : 'var(--text-tertiary)', border: channelsByType.whatsapp?.status === 'active' ? 'none' : '1px solid var(--border-subtle)' }}>
                            {channelsByType.whatsapp?.status === 'active' ? 'SECURE' : 'OFFLINE'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button className="mono font-bold" style={{ background: 'var(--color-bg-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '9px', padding: '8px 12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }} onClick={connectWhatsApp} disabled={channelBusy === 'whatsapp'}>
                            {channelBusy === 'whatsapp' ? '[ ESTABLISHING LINK... ]' : channelsByType.whatsapp?.status === 'active' ? '[ DIAGNOSE LINK ]' : '[ CONNECT API ]'}
                        </button>
                        {channelsByType.whatsapp?.status === 'active' && (
                            <button className="mono font-bold" style={{ background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', fontSize: '9px', padding: '8px 12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }} onClick={() => disconnectChannel(channelsByType.whatsapp.id)} disabled={channelBusy === channelsByType.whatsapp.id}>
                                [ SEVER ]
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ border: '1px solid var(--border-default)', background: '#000', padding: '20px' }}>
                    <div className="mono font-bold" style={{ fontSize: '12px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>[ SOCIAL ] PROTOCOLS</div>
                    <div className="mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                        LINKEDIN AND INSTAGRAM OPERATE AS LOCAL DRAFTS INJECTED DIRECTLY INTO THE INBOX PIPELINE.
                    </div>
                </div>
            </div>

            {channelsError && (
                <div className="mono font-bold" style={{ padding: '16px', border: '1px solid var(--color-danger)', background: 'rgba(255, 0, 0, 0.05)', color: 'var(--color-danger)', fontSize: '10px', letterSpacing: '0.1em', marginBottom: '24px' }}>
                    [ LINK FAILURE: {channelsError} ]
                </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button
                    className="mono font-bold"
                    style={{ background: activeChannel === 'all' ? 'var(--text-primary)' : 'transparent', color: activeChannel === 'all' ? '#000' : 'var(--text-tertiary)', border: '1px solid ' + (activeChannel === 'all' ? 'var(--text-primary)' : 'var(--border-subtle)'), padding: '8px 16px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
                    onClick={() => setActiveChannel('all')}
                >
                    [ OVERVIEW ] {totalUnread > 0 && <span style={{ marginLeft: '6px', color: activeChannel === 'all' ? '#000' : 'var(--color-danger)' }}>({totalUnread})</span>}
                </button>
                {CHANNELS.map(channel => {
                    const unreadCount = conversations.filter(c => inferChannel(c) === channel.key && c.unread_count > 0).length
                    return (
                        <button
                            key={channel.key}
                            className="mono font-bold"
                            style={{ background: activeChannel === channel.key ? 'var(--text-primary)' : 'transparent', color: activeChannel === channel.key ? '#000' : 'var(--text-tertiary)', border: '1px solid ' + (activeChannel === channel.key ? 'var(--text-primary)' : 'var(--border-subtle)'), padding: '8px 16px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
                            onClick={() => setActiveChannel(channel.key)}
                        >
                            {channel.icon} {channel.label}
                            {unreadCount > 0 && <span style={{ marginLeft: '6px', color: activeChannel === channel.key ? '#000' : 'var(--color-danger)' }}>({unreadCount})</span>}
                        </button>
                    )
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 2.5fr', gap: '16px', height: '600px' }}>
                <div style={{ border: '1px solid var(--border-default)', background: '#000', display: 'flex', flexDirection: 'column' }}>
                    <div className="mono font-bold text-tertiary" style={{ padding: '16px', borderBottom: '1px solid var(--border-default)', fontSize: '10px', letterSpacing: '0.1em' }}>
                        /// SECURE COMMS ({filteredConversations.length})
                    </div>
                    <div style={{ overflow: 'auto', flex: 1 }}>
                        {loading ? (
                            <div className="mono" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-primary)', fontSize: '10px', letterSpacing: '0.1em' }}>[ SCANNING CHANNELS... ]</div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="mono" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)', fontSize: '10px', letterSpacing: '0.1em' }}>
                                [ COMMS SILENT ]
                            </div>
                        ) : filteredConversations.map(conversation => {
                            const channel = inferChannel(conversation)
                            const channelMeta = CHANNELS.find(item => item.key === channel) || CHANNELS[0]
                            const company = conversation.contact?.company_id ? companyMap[conversation.contact.company_id] : null

                            return (
                                <div
                                    key={conversation.id}
                                    onClick={() => selectConvo(conversation)}
                                    className="mono"
                                    style={{
                                        padding: '16px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid var(--border-subtle)',
                                        background: selectedConversation?.id === conversation.id ? 'var(--border-subtle)' : 'transparent',
                                        transition: 'background 0.2s',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-tertiary)' }}>{channelMeta.icon}</span>
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '11px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{conversation.contact?.name || '[ UNKNOWN OP ]'}</div>
                                                <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>{company?.name || getChannelLabel(channel)}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                            <span style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>{formatMessageTime(conversation.last_message_at || conversation.created_at)}</span>
                                            {conversation.unread_count > 0 && <span style={{ fontSize: '9px', background: 'var(--color-danger)', color: '#000', padding: '2px 6px', fontWeight: 'bold' }}>{conversation.unread_count}</span>}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {conversation.status === 'pending' ? '>>> DRAFT SECURED' : `STATUS: ${conversation.status.toUpperCase()}`}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div style={{ border: '1px solid var(--border-default)', background: '#000', display: 'flex', flexDirection: 'column' }}>
                    {!selectedConversation ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="mono font-bold" style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '11px', letterSpacing: '0.1em' }}>
                                [ AWAITING FREQUENCY LOCK ]
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '16px', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                                <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: 32, height: 32, border: '1px solid var(--border-default)', background: 'var(--color-bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-tertiary)' }}>
                                        {CHANNELS.find(item => item.key === selectedChannel)?.icon || '[ UNK ]'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{selectedConversation.contact?.name || '[ UNKNOWN OP ]'}</div>
                                        <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>
                                            {selectedCompany?.name || 'UNAFFILIATED'} /// ENCRYPTION: {getChannelLabel(selectedChannel)}
                                            {selectedConversation.contact?.email && ` /// ${selectedConversation.contact.email}`}
                                            {selectedConversation.contact?.phone && ` /// ${selectedConversation.contact.phone}`}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {['email', 'whatsapp'].includes(selectedChannel) && (
                                        <span className="mono font-bold" style={{ alignSelf: 'center', color: canSendRealtime ? 'var(--color-success)' : 'var(--text-tertiary)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: '8px' }}>
                                            {canSendRealtime ? '[ LINK ESTABLISHED ]' : '[ OFFLINE ]'}
                                        </span>
                                    )}
                                    {draftMessage?.metadata?.launch_url && (
                                        <button className="mono font-bold" style={{ background: 'var(--color-primary)', color: '#000', border: 'none', padding: '8px 12px', fontSize: '9px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }} onClick={() => openDraft(draftMessage)}>[ OPEN LINK ]</button>
                                    )}
                                    <button className="mono font-bold" style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', padding: '8px 12px', fontSize: '9px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }} onClick={() => setShowTemplates(!showTemplates)}>[ TEMPLATES ]</button>
                                </div>
                            </div>

                            {showTemplates && (
                                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '8px', flexWrap: 'wrap', background: 'var(--color-bg-2)' }}>
                                    {TEMPLATES.map(template => (
                                        <button key={template.name} className="mono font-bold" style={{ background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', padding: '6px 10px', fontSize: '9px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }} onClick={() => setMessageInput(template.content)}>
                                            {template.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div style={{ flex: 1, padding: '24px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {messages.length === 0 ? (
                                    <div className="mono font-bold" style={{ color: 'var(--text-tertiary)', fontSize: '10px', letterSpacing: '0.1em', textAlign: 'center', marginTop: '20px' }}>[ SECURE CHANNEL OPENED. AWAITING TRANSMISSION. ]</div>
                                ) : messages.map(message => (
                                    <div key={message.id} className="mono" style={{ display: 'flex', justifyContent: message.direction === 'outbound' ? 'flex-end' : 'flex-start' }}>
                                        <div style={{
                                            maxWidth: '75%',
                                            padding: '16px',
                                            background: message.direction === 'outbound' ? 'var(--color-bg-2)' : '#000',
                                            color: message.direction === 'outbound' ? 'var(--color-primary)' : 'var(--text-primary)',
                                            border: message.direction === 'outbound' ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                                            borderLeft: message.direction === 'outbound' ? '1px solid var(--color-primary)' : '3px solid var(--border-subtle)'
                                        }}>
                                            {message.metadata?.subject && (
                                                <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                                    /// SUBJECT: {message.metadata.subject}
                                                </div>
                                            )}
                                            <div style={{ fontSize: '11px', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{message.content}</div>
                                            <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', marginTop: '12px', display: 'flex', justifyContent: 'space-between', gap: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                                <span>{formatMessageTime(message.created_at)}</span>
                                                <span style={{ color: message.status === 'draft' ? 'var(--color-warning)' : 'inherit' }}>{message.status || 'SENT'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '8px', padding: '16px', borderTop: '1px solid var(--border-subtle)', background: 'var(--color-bg-2)' }}>
                                <input
                                    style={{ flex: 1, background: '#000', border: '1px solid var(--border-subtle)', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '12px', outline: 'none', letterSpacing: '0.05em' }}
                                    placeholder={`TRANSMIT VIA ${getChannelLabel(selectedChannel).toUpperCase()}...`}
                                    value={messageInput}
                                    onChange={event => setMessageInput(event.target.value)}
                                    onKeyDown={event => {
                                        if (event.key === 'Enter' && !event.shiftKey) {
                                            event.preventDefault()
                                            if (canSendRealtime) sendRealtime()
                                            else saveDraft()
                                        }
                                    }}
                                />
                                {['email', 'whatsapp'].includes(selectedChannel) && (
                                    <button
                                        className="mono font-bold"
                                        style={{ background: canSendRealtime ? 'var(--color-primary)' : 'var(--color-bg-3)', color: canSendRealtime ? '#000' : 'var(--text-tertiary)', border: 'none', padding: '0 20px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: canSendRealtime ? 'pointer' : 'not-allowed' }}
                                        onClick={sendRealtime}
                                        disabled={!canSendRealtime}
                                    >
                                        [ DISPATCH ]
                                    </button>
                                )}
                                <button
                                    className="mono font-bold"
                                    style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', padding: '0 20px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
                                    onClick={() => saveDraft({ openFallback: !canSendRealtime && ['linkedin', 'instagram'].includes(selectedChannel) })}
                                >
                                    [ STAGE PENDING ]
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Messaging
