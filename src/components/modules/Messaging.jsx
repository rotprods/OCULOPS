// ===================================================
// ANTIGRAVITY OS — Messaging Hub
// Unified inbox backed by conversations/messages in Supabase
// ===================================================

import { useMemo, useState } from 'react'
import { useConversations } from '../../hooks/useConversations'
import { useMessagingChannels } from '../../hooks/useMessagingChannels'
import { useCompanies } from '../../hooks/useCompanies'
import { useAppStore } from '../../stores/useAppStore'
import { buildLaunchUrl, getChannelLabel } from '../../lib/outreach'

const CHANNELS = [
    { key: 'whatsapp', icon: '💬', label: 'WhatsApp', color: '#25D366' },
    { key: 'instagram', icon: '📸', label: 'Instagram', color: '#E4405F' },
    { key: 'email', icon: '📧', label: 'Email', color: 'var(--info)' },
    { key: 'linkedin', icon: '💼', label: 'LinkedIn', color: '#0077B5' },
]

const TEMPLATES = [
    { name: 'Intro', content: 'Hola, he estado analizando vuestra captación y veo dos automatizaciones claras que os podrían ahorrar mucho trabajo comercial.' },
    { name: 'Follow-up', content: 'Te escribo por si te cuadra que te comparta 2 ideas concretas para automatizar captación y seguimiento.' },
    { name: 'Demo', content: 'Si te encaja, te enseño en 10 minutos cómo dejar montado el flujo de captación, respuesta y CRM.' },
    { name: 'Cierre', content: 'Si lo ves alineado, esta semana puedo preparar el setup inicial y dejarlo operativo.' },
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
    })
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
        if (!launchUrl) return toast('No hay un enlace de envío para este borrador', 'warning')
        window.open(launchUrl, '_blank', 'noopener,noreferrer')
    }

    const saveDraft = async ({ openFallback = false } = {}) => {
        if (!messageInput.trim() || !selectedConversation) return

        const launchUrl = buildLaunchUrl(selectedChannel, {
            contact: selectedConversation.contact,
            company: selectedCompany,
            subject: `Seguimiento · ${selectedCompany?.name || selectedConversation.contact?.name || 'Lead'}`,
            body: messageInput,
        })

        const message = await sendMessage(selectedConversation.id, messageInput, {
            status: 'draft',
            metadata: {
                channel: selectedChannel,
                launch_url: launchUrl,
                subject: `Seguimiento · ${selectedCompany?.name || selectedConversation.contact?.name || 'Lead'}`,
                contact_id: selectedConversation.contact?.id || null,
                company_id: selectedCompany?.id || null,
                company_name: selectedCompany?.name || null,
            },
        })

        if (!message) {
            return toast('No se pudo guardar el borrador', 'warning')
        }

        if (openFallback && launchUrl) window.open(launchUrl, '_blank', 'noopener,noreferrer')

        setMessageInput('')
        toast(`Borrador ${getChannelLabel(selectedChannel)} guardado en Messaging`, 'success')
        return message
    }

    const sendRealtime = async () => {
        if (!messageInput.trim() || !selectedConversation) return
        if (!canSendRealtime) return toast(`Conecta ${getChannelLabel(selectedChannel)} para enviar de verdad`, 'warning')

        const subject = `Seguimiento · ${selectedCompany?.name || selectedConversation.contact?.name || 'Lead'}`
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

        if (!draft) return toast('No se pudo preparar el mensaje', 'warning')

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
            return toast(response.error, 'warning')
        }

        setMessageInput('')
        toast(`${getChannelLabel(selectedChannel)} enviado`, 'success')
    }

    return (
        <div className="fade-in">
            <div className="module-header">
                <h1>Messaging Hub</h1>
                <p>Inbox unificado con envío real por Gmail y WhatsApp, más drafts operativos para LinkedIn e Instagram.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <div className="card" style={{ padding: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <div>
                            <div style={{ fontWeight: 700 }}>📧 Gmail</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                {channelsByType.email?.status === 'active'
                                    ? channelsByType.email.email_address || 'Canal activo'
                                    : 'OAuth requerido para envío real'}
                            </div>
                        </div>
                        <span className={`badge ${channelsByType.email?.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                            {channelsByType.email?.status === 'active' ? 'activo' : 'offline'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" onClick={connectGmail} disabled={channelBusy === 'gmail'}>
                            {channelBusy === 'gmail' ? 'Conectando...' : channelsByType.email?.status === 'active' ? 'Reconectar' : 'Conectar'}
                        </button>
                        {channelsByType.email?.status === 'active' && (
                            <>
                                <button className="btn btn-ghost" onClick={() => syncGmail(channelsByType.email.id)} disabled={channelBusy === `sync:${channelsByType.email.id}`}>
                                    {channelBusy === `sync:${channelsByType.email.id}` ? 'Sincronizando...' : 'Sync inbox'}
                                </button>
                                <button className="btn btn-ghost" onClick={() => disconnectChannel(channelsByType.email.id)} disabled={channelBusy === channelsByType.email.id}>
                                    Desconectar
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="card" style={{ padding: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <div>
                            <div style={{ fontWeight: 700 }}>💬 WhatsApp</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                {channelsByType.whatsapp?.status === 'active'
                                    ? channelsByType.whatsapp.phone_number || 'Canal Cloud activo'
                                    : 'Cloud API requerida para envío real'}
                            </div>
                        </div>
                        <span className={`badge ${channelsByType.whatsapp?.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                            {channelsByType.whatsapp?.status === 'active' ? 'activo' : 'offline'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" onClick={connectWhatsApp} disabled={channelBusy === 'whatsapp'}>
                            {channelBusy === 'whatsapp' ? 'Conectando...' : channelsByType.whatsapp?.status === 'active' ? 'Revisar canal' : 'Activar'}
                        </button>
                        {channelsByType.whatsapp?.status === 'active' && (
                            <button className="btn btn-ghost" onClick={() => disconnectChannel(channelsByType.whatsapp.id)} disabled={channelBusy === channelsByType.whatsapp.id}>
                                Desconectar
                            </button>
                        )}
                    </div>
                </div>

                <div className="card" style={{ padding: 'var(--space-3)' }}>
                    <div style={{ fontWeight: 700, marginBottom: '6px' }}>💼 Social</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        LinkedIn e Instagram siguen operando como drafts guiados desde el inbox. Gmail y WhatsApp ya salen por API real.
                    </div>
                </div>
            </div>

            {channelsError && (
                <div className="card" style={{ padding: '12px 14px', marginBottom: 'var(--space-4)', borderColor: 'var(--danger)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--danger)' }}>{channelsError}</div>
                </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                <button className={`btn ${activeChannel === 'all' ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '12px' }} onClick={() => setActiveChannel('all')}>
                    📨 Todos {totalUnread > 0 && <span className="badge badge-danger" style={{ marginLeft: '4px', fontSize: '10px' }}>{totalUnread}</span>}
                </button>
                {CHANNELS.map(channel => {
                    const unreadCount = conversations.filter(conversation => inferChannel(conversation) === channel.key && conversation.unread_count > 0).length
                    return (
                        <button
                            key={channel.key}
                            className={`btn ${activeChannel === channel.key ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ fontSize: '12px' }}
                            onClick={() => setActiveChannel(channel.key)}
                        >
                            {channel.icon} {channel.label}
                            {unreadCount > 0 && <span className="badge badge-danger" style={{ marginLeft: '4px', fontSize: '10px' }}>{unreadCount}</span>}
                        </button>
                    )
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--space-4)', minHeight: '560px' }}>
                <div className="card" style={{ overflow: 'auto', maxHeight: '680px' }}>
                    <div className="card-header"><div className="card-title">Conversaciones ({filteredConversations.length})</div></div>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Cargando conversaciones...</div>
                    ) : filteredConversations.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                            Los borradores y mensajes creados desde Atlas aparecerán aquí.
                        </div>
                    ) : filteredConversations.map(conversation => {
                        const channel = inferChannel(conversation)
                        const channelMeta = CHANNELS.find(item => item.key === channel) || CHANNELS[0]
                        const company = conversation.contact?.company_id ? companyMap[conversation.contact.company_id] : null

                        return (
                            <div
                                key={conversation.id}
                                onClick={() => selectConvo(conversation)}
                                style={{
                                    padding: 'var(--space-3)',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid var(--border-subtle)',
                                    background: selectedConversation?.id === conversation.id ? 'var(--bg-primary)' : 'transparent',
                                    transition: 'background 0.2s',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                        <span style={{ fontSize: '16px' }}>{channelMeta.icon}</span>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{conversation.contact?.name || 'Lead sin nombre'}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{company?.name || getChannelLabel(channel)}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{formatMessageTime(conversation.last_message_at || conversation.created_at)}</span>
                                        {conversation.unread_count > 0 && <span className="badge badge-info" style={{ fontSize: '9px', minWidth: '18px', textAlign: 'center' }}>{conversation.unread_count}</span>}
                                    </div>
                                </div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {conversation.status === 'pending' ? 'Borrador listo para enviar' : `Estado: ${conversation.status}`}
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    {!selectedConversation ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>💬</div>
                                <h3>Selecciona una conversación</h3>
                                <p style={{ fontSize: 'var(--text-sm)' }}>Cada draft creado en Atlas o CRM cae directamente en este inbox.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', padding: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                        {CHANNELS.find(item => item.key === selectedChannel)?.icon || '💬'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700 }}>{selectedConversation.contact?.name || 'Lead sin nombre'}</div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                                            {selectedCompany?.name || 'Sin empresa'} · {getChannelLabel(selectedChannel)}
                                            {selectedConversation.contact?.email && ` · ${selectedConversation.contact.email}`}
                                            {selectedConversation.contact?.phone && ` · ${selectedConversation.contact.phone}`}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {['email', 'whatsapp'].includes(selectedChannel) && (
                                        <span className={`badge ${canSendRealtime ? 'badge-success' : 'badge-neutral'}`} style={{ alignSelf: 'center' }}>
                                            {canSendRealtime ? 'API real lista' : 'Canal sin conectar'}
                                        </span>
                                    )}
                                    {draftMessage?.metadata?.launch_url && (
                                        <button className="btn btn-primary" onClick={() => openDraft(draftMessage)}>Abrir canal</button>
                                    )}
                                    <button className="btn btn-ghost" onClick={() => setShowTemplates(!showTemplates)}>Plantillas</button>
                                </div>
                            </div>

                            {showTemplates && (
                                <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                    {TEMPLATES.map(template => (
                                        <button key={template.name} className="btn btn-ghost" style={{ fontSize: '11px' }} onClick={() => setMessageInput(template.content)}>
                                            📄 {template.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div style={{ flex: 1, padding: 'var(--space-4)', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                {messages.length === 0 ? (
                                    <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Todavía no hay mensajes en esta conversación.</div>
                                ) : messages.map(message => (
                                    <div key={message.id} style={{ display: 'flex', justifyContent: message.direction === 'outbound' ? 'flex-end' : 'flex-start' }}>
                                        <div style={{
                                            maxWidth: '78%',
                                            padding: 'var(--space-3)',
                                            borderRadius: 'var(--radius-md)',
                                            background: message.direction === 'outbound' ? 'var(--accent-primary)' : 'var(--bg-primary)',
                                            color: message.direction === 'outbound' ? 'var(--bg-primary)' : 'var(--text-primary)',
                                            border: message.status === 'draft' ? '1px dashed rgba(255,255,255,0.4)' : 'none',
                                        }}>
                                            {message.metadata?.subject && (
                                                <div style={{ fontSize: '10px', opacity: 0.72, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                    {message.metadata.subject}
                                                </div>
                                            )}
                                            <div style={{ fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap' }}>{message.content}</div>
                                            <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '6px', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                                <span>{formatMessageTime(message.created_at)}</span>
                                                <span>{message.status || 'sent'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
                                <input
                                    className="input"
                                    style={{ flex: 1 }}
                                    placeholder={`Escribe un mensaje para ${getChannelLabel(selectedChannel)}...`}
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
                                    <button className="btn btn-primary" onClick={sendRealtime} disabled={!canSendRealtime}>
                                        Enviar real
                                    </button>
                                )}
                                <button className="btn btn-ghost" onClick={() => saveDraft({ openFallback: !canSendRealtime && ['linkedin', 'instagram'].includes(selectedChannel) })}>
                                    Guardar draft
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
