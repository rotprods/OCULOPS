export const AGENT_AUTOMATION_PACKS = [
  {
    agentCodeName: 'cortex',
    label: 'CORTEX Orchestration',
    objective: 'Run multi-agent cycles, aggregate sub-agent results, and hand them off to n8n for downstream routing.',
    defaultTrigger: 'schedule',
    defaultActions: ['run_agent', 'launch_n8n', 'notify'],
    templates: [
      { id: 6902, name: 'Build Complete Sales Department with OpenAI Multi-Agent Team & CSO Orchestration', pageUrl: 'https://n8n.io/workflows/6902', downloadUrl: 'https://api.n8n.io/templates/workflows/6902' },
      { id: 11619, name: 'Automate Document Q&A with Multi-Agent RAG Orchestration using Contextual AI & Gemini', pageUrl: 'https://n8n.io/workflows/11619', downloadUrl: 'https://api.n8n.io/templates/workflows/11619' },
    ],
  },
  {
    agentCodeName: 'atlas',
    label: 'ATLAS Market Intel',
    objective: 'Continuously scan market, competitor, and trend sources and turn findings into structured studies.',
    defaultTrigger: 'schedule',
    defaultActions: ['run_agent', 'launch_n8n', 'notify'],
    templates: [
      { id: 12581, name: 'Generate AI market research reports from NewsAPI and competitor sites to Notion, Sheets and Slack', pageUrl: 'https://n8n.io/workflows/12581', downloadUrl: 'https://api.n8n.io/templates/workflows/12581' },
      { id: 10504, name: 'Automate Web Research & Analysis with Oxylabs & GPT for Comprehensive Reports', pageUrl: 'https://n8n.io/workflows/10504', downloadUrl: 'https://api.n8n.io/templates/workflows/10504' },
    ],
  },
  {
    agentCodeName: 'hunter',
    label: 'HUNTER Prospecting',
    objective: 'Generate, qualify, and route new leads into CRM and outbound motion automatically.',
    defaultTrigger: 'atlas_import',
    defaultActions: ['run_agent', 'create_deal', 'launch_n8n', 'notify'],
    templates: [
      { id: 7423, name: 'Lead Generation Agent', pageUrl: 'https://n8n.io/workflows/7423', downloadUrl: 'https://api.n8n.io/templates/workflows/7423' },
      { id: 3665, name: 'Automated Property Lead Generation with BatchData and CRM Integration', pageUrl: 'https://n8n.io/workflows/3665', downloadUrl: 'https://api.n8n.io/templates/workflows/3665' },
    ],
  },
  {
    agentCodeName: 'oracle',
    label: 'ORACLE Analytics',
    objective: 'Turn system data into dashboards, summaries, and high-signal analytical reports.',
    defaultTrigger: 'schedule',
    defaultActions: ['run_agent', 'launch_n8n', 'notify'],
    templates: [
      { id: 7210, name: 'Smartlead Email Campaign Analytics Dashboard with Google Sheets Integration', pageUrl: 'https://n8n.io/workflows/7210', downloadUrl: 'https://api.n8n.io/templates/workflows/7210' },
      { id: 3529, name: 'Token Estim8r UI – Visualize Token Usage analytics Dashboard in n8n', pageUrl: 'https://n8n.io/workflows/3529', downloadUrl: 'https://api.n8n.io/templates/workflows/3529' },
    ],
  },
  {
    agentCodeName: 'sentinel',
    label: 'SENTINEL Monitoring',
    objective: 'Watch anomalies and push fast alerts into Telegram and operating channels.',
    defaultTrigger: 'schedule',
    defaultActions: ['run_agent', 'launch_n8n', 'notify'],
    templates: [
      { id: 5852, name: 'Centralized Error Monitoring & Alerts via Telegram, Slack & Other Messengers', pageUrl: 'https://n8n.io/workflows/5852', downloadUrl: 'https://api.n8n.io/templates/workflows/5852' },
      { id: 9613, name: 'Kubernetes Deployment & Pod Monitoring with Telegram Alerts', pageUrl: 'https://n8n.io/workflows/9613', downloadUrl: 'https://api.n8n.io/templates/workflows/9613' },
    ],
  },
  {
    agentCodeName: 'forge',
    label: 'FORGE Content',
    objective: 'Generate, review, and publish content assets with human approval loops where needed.',
    defaultTrigger: 'manual',
    defaultActions: ['run_agent', 'launch_n8n', 'notify'],
    templates: [
      { id: 8700, name: 'Automate Social Media Content Creation & Publishing with AI & Human Approval Flow', pageUrl: 'https://n8n.io/workflows/8700', downloadUrl: 'https://api.n8n.io/templates/workflows/8700' },
      { id: 3066, name: 'Automate Multi-Platform Social Media Content Creation with AI', pageUrl: 'https://n8n.io/workflows/3066', downloadUrl: 'https://api.n8n.io/templates/workflows/3066' },
    ],
  },
  {
    agentCodeName: 'strategist',
    label: 'STRATEGIST Decisions',
    objective: 'Run deeper strategic research and deliver decision-ready recommendations.',
    defaultTrigger: 'schedule',
    defaultActions: ['run_agent', 'launch_n8n', 'notify'],
    templates: [
      { id: 12537, name: 'Run multi-model research analysis and email reports with GPT-4, Claude and NVIDIA NIM', pageUrl: 'https://n8n.io/workflows/12537', downloadUrl: 'https://api.n8n.io/templates/workflows/12537' },
      { id: 8722, name: 'Comprehensive SEO Keyword Research & Analysis with DataForSEO and Airtable', pageUrl: 'https://n8n.io/workflows/8722', downloadUrl: 'https://api.n8n.io/templates/workflows/8722' },
    ],
  },
  {
    agentCodeName: 'scribe',
    label: 'SCRIBE Reports',
    objective: 'Package daily and weekly summaries into consistently delivered executive reports.',
    defaultTrigger: 'schedule',
    defaultActions: ['run_agent', 'launch_n8n', 'notify'],
    templates: [
      { id: 5405, name: 'Daily Financial News Summary with Ollama LLM - Automated Email Report', pageUrl: 'https://n8n.io/workflows/5405', downloadUrl: 'https://api.n8n.io/templates/workflows/5405' },
      { id: 6480, name: 'PDF Invoice Data Extraction & Tracking with Google Drive, Claude AI & Telegram', pageUrl: 'https://n8n.io/workflows/6480', downloadUrl: 'https://api.n8n.io/templates/workflows/6480' },
    ],
  },
  {
    agentCodeName: 'herald',
    label: 'HERALD Telegram Delivery',
    objective: 'Turn reports and agent outputs into Telegram-ready briefings for mobile review.',
    defaultTrigger: 'schedule',
    defaultActions: ['run_agent', 'launch_n8n', 'notify'],
    templates: [
      { id: 8500, name: 'Jarvis: Productivity AI Agent for tasks, calendar, email & expense using MCPs', pageUrl: 'https://n8n.io/workflows/8500', downloadUrl: 'https://api.n8n.io/templates/workflows/8500' },
      { id: 4818, name: 'Send Telegram Notification for New WooCommerce Orders', pageUrl: 'https://n8n.io/workflows/4818', downloadUrl: 'https://api.n8n.io/templates/workflows/4818' },
    ],
  },
]

export function getAgentAutomationPack(agentCodeName) {
  return AGENT_AUTOMATION_PACKS.find(pack => pack.agentCodeName === agentCodeName) || null
}
