import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useOrg } from '../hooks/useOrg'

export default function UserMenu() {
    const { setOrganizations, setCurrentOrg } = useOrg()
    const [user, setUser] = useState(null)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setOrganizations([])
        setCurrentOrg(null)
    }

    if (!user) return null

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '6px 4px', background: 'none', border: 'none',
                    cursor: 'pointer', borderRadius: 4,
                }}
            >
                <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--color-primary)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: '#000',
                    fontFamily: 'var(--font-mono)', flexShrink: 0,
                    textTransform: 'uppercase',
                }}>
                    {user.email[0]}
                </div>
                <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                    <div style={{
                        fontSize: 11, color: 'var(--color-text-2)',
                        fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{user.email}</div>
                    <div style={{
                        fontSize: 9, color: 'var(--color-text-3)',
                        fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
                    }}>OPERATOR</div>
                </div>
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute', bottom: '100%', left: 0, width: '100%',
                    marginBottom: 4, background: 'var(--color-bg-2)',
                    border: '1px solid var(--color-border)', borderRadius: 4,
                    overflow: 'hidden', zIndex: 50,
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
                }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            width: '100%', padding: '10px 12px',
                            fontSize: 11, fontFamily: 'var(--font-mono)',
                            color: 'var(--color-danger)', background: 'none',
                            border: 'none', cursor: 'pointer', letterSpacing: '0.05em',
                        }}
                    >
                        DISCONNECT
                    </button>
                </div>
            )}
        </div>
    )
}
