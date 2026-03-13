# AG2-C6 Synthetic Smoke

Generated at: 2026-03-13T07:02:31.219Z
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
- channel_id: `21688633-284c-4bc9-8020-b434ebabc97e`
- contact_id: `30bfef73-0c09-460f-9056-33ba3f5e1ecc`
- conversation_id: `8cf261db-08c8-4edb-8fcc-52ff64173f3f`
- queue_id: `62a4fe8a-5548-4858-af52-8151fdcd7bef`
- outbound_message_id: `6a898cb2-a133-42e8-b0c5-acdef3ad0962`
- inbound_message_id: `ff4ee06c-b837-46e2-b9df-5beffdde5e16`

## Artifacts

- JSON: `docs/runbooks/ag2-c6-synthetic-smoke.latest.json`
- Markdown: `docs/runbooks/ag2-c6-synthetic-smoke.md`
