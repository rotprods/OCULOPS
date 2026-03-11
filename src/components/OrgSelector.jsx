import React, { useState } from 'react'
import { useOrg } from '../hooks/useOrg'
import './OrgSelector.css'

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
            <form onSubmit={handleCreate} className="os-org-form">
                <input
                    autoFocus
                    placeholder="Org Name..."
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    className="os-org-input"
                />
                <div className="os-org-form-actions">
                    <button type="submit" className="os-org-btn-create">CREATE</button>
                    <button type="button" onClick={() => setIsCreating(false)} className="os-org-btn-cancel">CANCEL</button>
                </div>
            </form>
        )
    }

    return (
        <div>
            <select
                value={currentOrg?.id || ''}
                onChange={(e) => switchOrganization(organizations.find(o => o.id === e.target.value))}
                className="os-org-select"
            >
                {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
            </select>
            <button onClick={() => setIsCreating(true)} className="os-org-new-btn">
                <span style={{ fontSize: 12 }}>+</span>
                <span>NEW ORG</span>
            </button>
        </div>
    )
}