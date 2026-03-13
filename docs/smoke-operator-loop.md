# Operator Closed-Loop — Manual Smoke Test

> AG1-P2.2 | Provider steps not automatable via Playwright

## Prerequisites

- Authenticated session in OCULOPS
- At least 1 conversation in Messaging
- At least 1 agent registered in agent_registry
- WhatsApp/Gmail channel connected (optional — tests draft flow without)

---

## 1. Messaging Status Chips (AG1-P0.1)

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Open `/messaging` | Conversation list loads |
| 1.2 | Check any conversation item | Status chip visible: Draft (orange), Sent (blue), Delivered (green), Read (green), Failed (red) |
| 1.3 | Click a conversation with messages | Message bubbles show status chip in footer (replacing plain text) |
| 1.4 | Send a draft message | Bubble appears with "DRAFT" chip |
| 1.5 | After dispatch completes | Chip updates to "SENT" or "FAILED" |

## 2. Blocked Indicators (AG1-P0.2)

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Trigger an outreach that requires approval | Conversation item shows "Pending approval" badge |
| 2.2 | Click "Pending approval" badge on convo item | Navigates to `/agents?tab=approvals&approval=<id>` |
| 2.3 | In chat header (selected convo with approval) | "Pending approval" badge visible next to trace link |
| 2.4 | After approving in Agents tab | Badge disappears on next refresh |

## 3. Run-Inspection Affordances (AG1-P0.3)

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Open `/control-tower?corr=<real-id>` | Trace filter, trace actions, and trace timeline visible |
| 3.2 | In trace timeline, find an approval event | "Open approval" button appears inline |
| 3.3 | In trace timeline, find a message event | "Open conversation" button appears inline |
| 3.4 | In trace timeline, find an agent event | "Agent logs" button appears inline |
| 3.5 | Click "Open approval" | Navigates to Agents approvals tab |
| 3.6 | Click "Open conversation" | Navigates to Messaging with conversation selected |

## 4. One-Click Operator Actions (AG1-P0.4)

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | Open `/agents?tab=approvals` | Cards show "Trace" and "Conversation" buttons when correlation exists |
| 4.2 | Click "Trace" on approval card | Navigates to `/control-tower?corr=<id>` |
| 4.3 | Click "Conversation" on approval card | Navigates to `/messaging?correlation=<id>` |
| 4.4 | Open `/agents?tab=outreach` | Sent/approved items show "Trace" button when correlation exists |
| 4.5 | Open `/agents?tab=logs` | Log rows with correlation_id show "Trace" button |

## 5. Provider Steps (Manual Only)

These steps involve external provider APIs and cannot be automated:

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Send email via Gmail channel | Email arrives at recipient inbox |
| 5.2 | Check Gmail webhook callback | Message status updates to "delivered" in OCULOPS |
| 5.3 | Send WhatsApp via Cloud API | WhatsApp message delivered |
| 5.4 | Check WhatsApp webhook callback | Status updates to "delivered"/"read" |
| 5.5 | Receive inbound reply (email) | New message appears in conversation as inbound |
| 5.6 | Receive inbound reply (WhatsApp) | New message appears with "read" status |

## 6. End-to-End Loop Validation

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Run Cortex cycle from Agents Network tab | Pipeline run appears in ControlTower |
| 6.2 | Outreach items created by Hunter/Outreach | Items appear in Agents Outreach tab |
| 6.3 | Approve outreach item | Approval request created in Approvals tab |
| 6.4 | Approve & Send from Approvals tab | Message dispatched, conversation created |
| 6.5 | Open conversation from approval card | Messaging shows the sent message with "SENT" chip |
| 6.6 | Click trace link in conversation | ControlTower shows full event timeline |
| 6.7 | Answer "What is blocked?" from UI | Blocked conversations show orange "Pending approval" badge |

---

## Verdict

- [ ] All automated E2E tests pass (`npx playwright test tests/e2e/operator-loop.spec.js`)
- [ ] Manual steps 1-4 verified
- [ ] Provider steps 5.1-5.6 verified (or documented as pending channel secrets)
- [ ] Loop validation 6.1-6.7 verified
