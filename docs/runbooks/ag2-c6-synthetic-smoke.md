# AG2-C6 Synthetic Smoke

Generated at: 2026-03-14T02:16:25.682Z
Result: PASS

## Flow

- Create synthetic outbound queue + sent message
- Trigger `gmail-inbound` synthetic inbound action
- Verify `outreach_queue.status = replied` and message linkage

## Verification

- Queue status: replied
- Provider status: replied
- Queue message_id == inbound message id: true
- Conversation last_inbound_at set: true

## IDs

- org_id: `a11b1e98-7fd9-4789-aab9-ab5a77494627`
- channel_id: `1003d3c7-12e0-4b3f-a53e-833d454a02d9`
- contact_id: `69dd5207-cfa6-4d36-8c6d-b208001c3c30`
- conversation_id: `da2fb285-3439-41d9-b2ff-eab373759443`
- queue_id: `5e6d637e-c667-4f67-8372-4f116d1555d2`
- outbound_message_id: `703d90be-617c-4c7a-8d7f-ba3a9677a9ac`
- inbound_message_id: `68a759b5-d69e-4c7d-8e1c-8322ed7e9a81`

## Artifacts

- JSON: `docs/runbooks/ag2-c6-synthetic-smoke.latest.json`
- Markdown: `docs/runbooks/ag2-c6-synthetic-smoke.md`
