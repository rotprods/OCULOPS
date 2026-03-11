import React, { useState } from 'react'
import { useOrg } from '../hooks/useOrg'

export default function OrgSelector() {
    const { organizations, currentOrg, switchOrganization, createOrganization } = useOrg()
    const [isCreating, setIsCreating] = useState(false)
    const [newOrgName, setNewOrgName] = useState('')

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!newOrgName.trim()) return
        await createOrganization(newOrgName)
        setIsCreating(false)
        setNewOrgName('')
    }

    if (isCreating) {
        return (
            <form onSubmit={handleCreate} style={{
                padding: 8, background: 'var(--color-bg-3)', borderRadius: 4,
                border: '1px solid var(--color-border)',
            }}>
                <input
                    autoFocus
                    placeholder="Org Name..."
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    style={{
                        width: '100%', background: 'var(--color-bg)', color: 'var(--color-text)',
                        fontSize: 12, padding: '4px 8px', borderRadius: 3, marginBottom: 8,
                        border: '1px solid var(--color-border)', outline: 'none',
                        fontFamily: 'var(--font-mono)',
                    }}
                />
                <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                    <button type="submit" style={{
                        background: 'var(--color-primary)', color: '#000', padding: '3px 10px',
                        borderRadius: 3, border: 'none', cursor: 'pointer', fontWeight: 600,
                        fontFamily: 'var(--font-mono)', fontSize: 10,
                    }}>CREATE</button>
                    <button type="button" onClick={() => setIsCreating(false)} style={{
                        background: 'none', border: 'none', color: 'var(--color-text-3)',
                        cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10,
                    }}>CANCEL</button>
                </div>
            </form>
        )
    }

    return (
        <div>
            <select
                value={currentOrg?.id || ''}
                onChange={(e) => switchOrganization(organizations.find(o => o.id === e.target.value))}
                style={{
                    width: '100%', appearance: 'none', WebkitAppearance: 'none',
                    background: 'var(--color-bg)', color: 'var(--color-primary)',
                    fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
                    padding: '6px 8px', borderRadius: 3,
                    border: '1px solid var(--color-border)', cursor: 'pointer',
                    outline: 'none',
                }}
            >
                {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
            </select>
            <button
                onClick={() => setIsCreating(true)}
                style={{
                    marginTop: 6, display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 10, color: 'var(--color-text-3)', background: 'none',
                    border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)',
                    padding: 0, letterSpacing: '0.05em',
                }}
            >
                <span style={{ fontSize: 12 }}>+</span>
                <span>NEW ORG</span>
            </button>
        </div>
    )
}