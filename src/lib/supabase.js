// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — Supabase Client
// ═══════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials not configured. Running in offline mode.');
}

// Ensure URL is at least syntactically valid to prevent `@supabase/supabase-js`'s internal "Invalid supabaseUrl" throw.
const isValidUrl = (url) => {
    try { new URL(url); return true; } catch { return false; }
};

const hasCredentials = supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl);

// A safe stub that prevents the entire React tree from crashing if Supabase is offline/misconfigured.
// The ErrorBoundary or individual components will just see failed requests or null users.
const DummyClient = {
    from: () => ({
        select: () => ({
            eq: () => ({
                single: async () => ({ data: null, error: { message: 'ENV_MISSING' } }),
                order: async () => ({ data: [], error: { message: 'ENV_MISSING' } })
            })
        }),
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'ENV_MISSING' } }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'ENV_MISSING' } }) }) }) }),
        delete: () => ({ eq: async () => ({ error: { message: 'ENV_MISSING' } }) })
    }),
    auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        signInWithPassword: async () => ({ error: { message: 'Supabase credentials missing in Edge/Vercel' } }),
        signUp: async () => ({ error: { message: 'Supabase credentials missing in Edge/Vercel' } }),
        signInWithOtp: async () => ({ error: { message: 'Supabase credentials missing in Edge/Vercel' } }),
        signOut: async () => ({ error: null })
    },
    channel: () => ({
        on: () => ({ subscribe: () => ({ unsubscribe: () => { } }) })
    })
};

export const supabase = hasCredentials
    ? createClient(supabaseUrl, supabaseAnonKey, {
        realtime: {
            params: { eventsPerSecond: 10 },
        },
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
    })
    : DummyClient;

const USER_SCOPED_TABLES = new Set([
    'alerts',
    'api_connectors',
    'automation_workflows',
    'automation_runs',
    'bets',
    'campaigns',
    'companies',
    'contacts',
    'conversations',
    'crm_activities',
    'decisions',
    'deals',
    'detected_leads',
    'detection_rules',
    'experiments',
    'finance_entries',
    'knowledge_entries',
    'messaging_channels',
    'messages',
    'niches',
    'opportunities',
    'pipeline_entries',
    'prospector_leads',
    'prospector_scans',
    'resource_allocations',
    'signals',
    'agent_studies',
    'agent_delivery_targets',
    'tasks',
]);

// ═══ Helper: Generic CRUD operations ═══

export async function fetchAll(table, filters = {}) {
    if (!supabase) return [];
    let query = supabase.from(table).select('*');
    Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
    });
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) { console.error(`Error fetching ${table}:`, error); return []; }
    return data;
}

export async function fetchOne(table, id) {
    if (!supabase) return null;
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    if (error) { console.error(`Error fetching ${table}/${id}:`, error); return null; }
    return data;
}

export async function insertRow(table, row) {
    if (!supabase) return null;
    let payload = row;

    if (USER_SCOPED_TABLES.has(table) && !row.user_id) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) payload = { ...row, user_id: user.id };
    }

    const { data, error } = await supabase.from(table).insert(payload).select().single();
    if (error) { console.error(`Error inserting into ${table}:`, error); return null; }
    return data;
}

export async function updateRow(table, id, updates) {
    if (!supabase) return null;
    const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
    if (error) { console.error(`Error updating ${table}/${id}:`, error); return null; }
    return data;
}

export async function deleteRow(table, id) {
    if (!supabase) return false;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) { console.error(`Error deleting from ${table}/${id}:`, error); return false; }
    return true;
}

// ═══ Realtime subscription helper ═══

export function subscribeToTable(table, callback, filters = {}) {
    if (!supabase) return null;
    const channel = supabase
        .channel(`${table}_changes`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table,
            ...filters,
        }, (payload) => callback(payload))
        .subscribe();
    return channel;
}

// ═══ Auth helpers ═══

export async function signInWithEmail(email, password) {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email, password, fullName) {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    return supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
    });
}

export async function signInWithMagicLink(email) {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    return supabase.auth.signInWithOtp({ email });
}

export async function signOut() {
    if (!supabase) return;
    return supabase.auth.signOut();
}

export async function getCurrentUser() {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function getCurrentSession() {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

export function onAuthStateChange(callback) {
    if (!supabase) return { data: { subscription: { unsubscribe: () => { } } } };
    return supabase.auth.onAuthStateChange(callback);
}

export default supabase;
