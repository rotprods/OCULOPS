import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useOrg } from '../hooks/useOrg'
import './UserMenu.css'

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
            <button onClick={() => setIsOpen(!isOpen)} className="os-user-trigger">
                <div className="os-user-avatar">
                    {user.email[0]}
                </div>
                <div className="os-user-info">
                    <div className="os-user-email">{user.email}</div>
                    <div className="os-user-role">OPERATOR</div>
                </div>
            </button>

            {isOpen && (
                <div className="os-user-dropdown">
                    <button onClick={handleLogout} className="os-user-logout">
                        DISCONNECT
                    </button>
                </div>
            )}
        </div>
    )
}
