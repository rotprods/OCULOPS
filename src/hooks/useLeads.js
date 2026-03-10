// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — React Hook: useLeads
// Example hook for Supabase data integration
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { fetchAll, insertRow, updateRow, deleteRow, subscribeToTable } from '../lib/supabase';

export function useLeads() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAll('contacts', { status: 'raw' });
            setLeads(data);
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        load();

        // Real-time subscription
        const channel = subscribeToTable('contacts', (payload) => {
            if (payload.eventType === 'INSERT') {
                setLeads((prev) => [payload.new, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
                setLeads((prev) => prev.map((l) => (l.id === payload.new.id ? payload.new : l)));
            } else if (payload.eventType === 'DELETE') {
                setLeads((prev) => prev.filter((l) => l.id !== payload.old.id));
            }
        });

        return () => channel?.unsubscribe();
    }, [load]);

    const addLead = async (lead) => {
        const result = await insertRow('contacts', lead);
        if (result) setLeads((prev) => [result, ...prev]);
        return result;
    };

    const updateLead = async (id, updates) => {
        const result = await updateRow('contacts', id, updates);
        if (result) setLeads((prev) => prev.map((l) => (l.id === id ? result : l)));
        return result;
    };

    const removeLead = async (id) => {
        const success = await deleteRow('contacts', id);
        if (success) setLeads((prev) => prev.filter((l) => l.id !== id));
        return success;
    };

    return { leads, loading, error, addLead, updateLead, removeLead, reload: load };
}
