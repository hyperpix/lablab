# Band.ai Agent Configuration

This directory contains everything needed to connect the Dently dental scribe agents with **Band.ai** (agent mesh) and **Featherless.ai** (LLM inference).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Band.ai Platform                          │
│  (Agent Mesh — identity, routing, chat rooms, audit trail)       │
└────────────────────────┬────────────────────────────────────────┘
                         │ WebSocket / REST API
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Agent Runner (agent-runner/)                    │
│  Node.js service that runs the 3 dental agents as remote agents   │
│  on Band, using Featherless for LLM inference                     │
└────────────────────────┬────────────────────────────────────────┘
                         │ OpenAI SDK
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Featherless.ai                                │
│  (LLM Inference — DeepSeek-V3-0324)                              │
└─────────────────────────────────────────────────────────────────┘
```

## Getting Started

### 1. Register Agents on Band.ai

You need a Band.ai Human API key first (get one from https://band.ai/settings).

```bash
# Install jq if you don't have it: https://jqlang.github.io/jq/download/
BAND_API_KEY=your_human_api_key_here ./register-agents.sh
```

This registers three agents:

| Agent | Name | Purpose |
|---|---|---|
| ScribeAgent | `ScribeAgent` | Parses clinical transcripts → structured diagnostics |
| PlannerAgent | `PlannerAgent` | Recommends treatments, investigations, teeth markings |
| PharmacologistAgent | `PharmacologistAgent` | Suggests prescriptions with allergy cross-reference |

The script outputs each agent's UUID and API key. **Save these — the API keys are only shown once.**

### 2. Set Environment Variables

Add to your `.env`:

```env
# Featherless.ai LLM
VITE_FEATHERLESS_API_KEY=your_featherless_key

# Band.ai (optional — enables agent mesh integration)
VITE_BAND_API_KEY=your_band_human_api_key
VITE_SCRIBE_UUID=uuid_from_registration
VITE_PLANNER_UUID=uuid_from_registration
VITE_PHARMACOLOGIST_UUID=uuid_from_registration
```

### 3. Run the Agent Runner (Production)

The agent runner connects the Band agents to Featherless. Run it alongside your app:

```bash
cd band/agent-runner
npm install

BAND_SCRIBE_KEY=agent_key_from_registration \
BAND_PLANNER_KEY=agent_key_from_registration \
BAND_PHARMA_KEY=agent_key_from_registration \
FEATHERLESS_API_KEY=your_featherless_key \
npm run start
```

The runner polls Band for pending @mentions, processes them via Featherless, and posts results back.

## Agent Definitions

Each agent is defined in `agents/` as a JSON file with:
- `name` — Agent display name
- `description` — What the agent does
- `llm_provider` — Set to `Featherless.ai`
- `model` — LLM model to use
- `system_prompt` — Instructions defining agent behavior
- `temperature` — LLM temperature setting

## How It Works

1. **Frontend** sends a transcript to `runClinicalWorkflow()` (in `src/lib/clinicalAgents.ts`)
2. **Direct mode**: The function calls Featherless directly for each agent, aggregates results
3. **Band mode** (optional): Results are also posted to a Band chat room where the agent-runner can pick them up
4. **Agent runner** processes Band messages, calls Featherless, and posts responses back

## Files

| File | Purpose |
|---|---|
| `agents/scribe-agent.json` | Scribe agent definition |
| `agents/planner-agent.json` | Planner agent definition |
| `agents/pharmacologist-agent.json` | Pharmacologist agent definition |
| `register-agents.sh` | Registers all 3 agents on Band.ai |
| `agent-runner/index.ts` | Node.js agent runner service |
| `agent-runner/package.json` | Runner dependencies |
| `agent-runner/tsconfig.json` | TypeScript config |
