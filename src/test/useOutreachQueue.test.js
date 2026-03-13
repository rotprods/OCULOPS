import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const { mockQueryResult, mockQueryBuilder, mockCallSupabaseFunction, mockSubscribeToTable } = vi.hoisted(() => {
    const mockQueryResult = { data: [], error: null }
    const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation(() => Promise.resolve(mockQueryResult)),
    }

    return {
        mockQueryResult,
        mockQueryBuilder,
        mockCallSupabaseFunction: vi.fn(),
        mockSubscribeToTable: vi.fn(() => ({ unsubscribe: vi.fn() })),
    }
})

vi.mock('../lib/supabase', () => ({
    supabase: { from: vi.fn(() => mockQueryBuilder) },
    callSupabaseFunction: mockCallSupabaseFunction,
    subscribeDebouncedToTable: mockSubscribeToTable,
}))

import { useOutreachQueue } from '../hooks/useOutreachQueue'

const mockRows = [
    { id: 'q1', status: 'staged', subject: 'Subject 1', recipient_email: 'one@example.com', html_body: '<p>Hello one</p>', prospector_leads: { ai_score: 88, estimated_deal_value: 2000 } },
    { id: 'q2', status: 'approved', subject: 'Subject 2', recipient_email: 'two@example.com', html_body: '<p>Hello two</p>', prospector_leads: { ai_score: 72, estimated_deal_value: 1500 } },
    { id: 'q3', status: 'sent', subject: 'Subject 3', recipient_email: 'three@example.com', html_body: '<p>Hello three</p>', prospector_leads: { ai_score: 61, estimated_deal_value: 800 } },
]

describe('useOutreachQueue', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockQueryResult.data = mockRows
        mockQueryResult.error = null
        mockCallSupabaseFunction.mockResolvedValue({ ok: true })
    })

    it('loads queue rows and computes stats', async () => {
        const { result } = renderHook(() => useOutreachQueue('staged'))

        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.items).toHaveLength(1)
        expect(result.current.items[0].id).toBe('q1')
        expect(result.current.stats.staged).toBe(1)
        expect(result.current.stats.approved).toBe(1)
        expect(result.current.stats.sent).toBe(1)
    })

    it('subscribes to outreach queue realtime updates', async () => {
        renderHook(() => useOutreachQueue())
        await waitFor(() => expect(mockSubscribeToTable).toHaveBeenCalled())
        expect(mockSubscribeToTable).toHaveBeenCalledWith('outreach_queue', expect.any(Function))
    })

    it('approveItem calls the outreach function and reloads', async () => {
        const { result } = renderHook(() => useOutreachQueue())
        await waitFor(() => expect(result.current.loading).toBe(false))

        await act(async () => {
            await result.current.approveItem('q1')
        })

        expect(mockCallSupabaseFunction).toHaveBeenCalledWith('agent-outreach', {
            body: { action: 'approve', id: 'q1' },
        })
        expect(mockQueryBuilder.order).toHaveBeenCalledTimes(2)
    })
})
