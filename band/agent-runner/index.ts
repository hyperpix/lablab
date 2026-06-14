/**
 * Band.ai Agent Runner for Dently
 *
 * Runs the three dental agents (Scribe, Planner, Pharmacologist) as
 * remote agents on Band.ai, using Featherless.ai for LLM inference.
 *
 * The PharmacologistAgent uses a two-step process:
 *   1. Identifies needed medications via Featherless
 *   2. Looks up each drug on the open.fda.gov API
 *   3. Generates final prescriptions using real FDA-sourced data
 *
 * Architecture:
 *   Band.ai (Agent Mesh)  <-WebSocket/REST->  Agent Runner  <-OpenAI SDK->  Featherless.ai (LLM)
 *                                                                               |
 *                                                                          open.fda.gov (drug data)
 *
 * Usage:
 *   cd band/agent-runner
 *   npm start
 */

import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from the project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// ── Configuration ──────────────────────────────────────────────

const BAND_WS_URL = "wss://app.band.ai/api/v1/socket/websocket";
const BAND_API = "https://app.band.ai/api/v1";
const FEATHERLESS_API = "https://api.featherless.ai/v1";
const MODEL = "Qwen/Qwen2.5-7B-Instruct";
const POLL_INTERVAL_MS = 2000;

interface AgentConfig {
  name: string;
  apiKey: string;
  systemPrompt: string;
}

const AGENTS: AgentConfig[] = [
  {
    name: "ScribeAgent",
    apiKey: process.env.BAND_SCRIBE_KEY || "",
    systemPrompt: `You are a specialized Dental Scribe Agent.
Your job is to parse unstructured clinical transcripts/audio dictations and return a strictly structured JSON containing the 7 clinical sections.

Output Format (strict JSON only):
{
  "chief_complaint": "Extracted chief complaint...",
  "medical_history_notes": "Patient medical history...",
  "other_conditions": "Other conditions...",
  "drug_history": "Allergies or current medications...",
  "clinical_findings": "Clinical findings...",
  "investigation_notes": "Any investigations (radiographs, etc.)...",
  "diagnosis_notes": "Final diagnosis..."
}`,
  },
  {
    name: "PlannerAgent",
    apiKey: process.env.BAND_PLANNER_KEY || "",
    systemPrompt: `You are a Dental Treatment Planner Agent.
Based on the provided diagnostics JSON, recommend:
1. Investigations to conduct (e.g., radiographs, CBCT).
2. Dental treatment procedures to perform, including teeth numbers if specified, and logical phase.
3. Visual teeth chart markings that need to be made.

Supported tooth conditions: 'compromised', 'endo', 'filled', 'missing', 'rotated', 'gum-recessed', 'displaced', 'sound'.

Output Format (strict JSON only):
{
  "investigations": ["Investigation 1", "Investigation 2"],
  "treatments": [
    { "description": "Procedure name", "tooth": "36", "phase": "Phase 2 - Restorative" }
  ],
  "teeth_marks": [
    { "tooth_iso": 36, "condition": "compromised", "notes": "Deep carious lesion on distal-occlusal" }
  ]
}`,
  },
  {
    name: "PharmacologistAgent",
    apiKey: process.env.BAND_PHARMA_KEY || "",
    // Step 1 prompt: only identifies drug names (FDA lookup happens after)
    systemPrompt: `You are a Dental Pharmacologist Agent.
Based on the diagnostics and treatment plan, identify what medications are needed.
Consider the patient's allergies, medical history, and current medications.

Output ONLY a JSON object with an array of drug names (generic names preferred):
{
  "recommended_drugs": ["Ibuprofen", "Amoxicillin", "Chlorhexidine gluconate"]
}`,
  },
];

// Step 2 prompt: generate final prescriptions using FDA-sourced drug data
const PHARMA_FINAL_PROMPT = `You are a Dental Pharmacologist Agent. You are given FDA-sourced drug data for medications to prescribe. Using the real drug information (brand names, active ingredients, dosage forms, routes, marketing status), generate the final prescription details.

For each drug, use the FDA data to determine:
- The proper name (brand or generic)
- Appropriate dosage based on the dosage form and route
- Frequency based on standard dental practice
- Duration based on the condition being treated
- Any relevant warnings (contraindications, interactions)

Cross-reference the patient's drug history, allergies, and medical profile.

Output Format (strict JSON only):
{
  "prescriptions": [
    {
      "name": "Drug Name",
      "dosage": "dosage strength",
      "frequency": "how often",
      "duration": "how long",
      "warning": "any warnings or empty string"
    }
  ]
}`;

// ── FDA Drug Lookup ────────────────────────────────────────────

/** Look up a drug on the FDA Drugs@FDA API and return structured info. */
async function lookupDrugOnFDA(drugName: string): Promise<any[]> {
  const encoded = encodeURIComponent(drugName);
  const url = `https://api.fda.gov/drug/drugsfda.json?search=products.brand_name:%22${encoded}%22+OR+products.active_ingredients.name:%22${encoded}%22&limit=3`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    const results = json.results || [];
    const drugs: any[] = [];
    for (const r of results.slice(0, 3)) {
      for (const p of (r.products || []).slice(0, 2)) {
        drugs.push({
          searched_for: drugName,
          brand_name: p.brand_name,
          active_ingredients: p.active_ingredients
            ?.map((a: any) => `${a.name} ${a.strength || ""}`.trim())
            .join(", "),
          dosage_form: p.dosage_form,
          route: p.route,
          marketing_status: p.marketing_status,
          sponsor: r.sponsor_name,
        });
      }
    }
    return drugs;
  } catch {
    return [];
  }
}

// ── Featherless LLM Client ─────────────────────────────────────

function createFeatherlessClient(apiKey: string): OpenAI {
  return new OpenAI({
    baseURL: FEATHERLESS_API,
    apiKey,
  });
}

async function callFeatherless(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  retries = 4,
  delayMs = 1500
): Promise<string> {
  const client = createFeatherlessClient(apiKey);
  for (let i = 0; i < retries; i++) {
    try {
      const response = await client.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      });
      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("Featherless returned empty response");
      return content;
    } catch (err: any) {
      const isRateLimit = err.status === 429 || err.message?.includes("limit") || err.message?.includes("concurrency") || err.message?.includes("Concurrent");
      if (isRateLimit && i < retries - 1) {
        const backoff = delayMs * Math.pow(2, i) + Math.random() * 500;
        console.warn(`[Featherless] Concurrency/Rate limit hit. Retrying in ${Math.round(backoff)}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Featherless failed after maximum retries");
}

let featherlessQueue: Promise<any> = Promise.resolve();

async function callFeatherlessQueued(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
): Promise<string> {
  const myTurn = featherlessQueue.then(async () => {
    const buffer = 800 + Math.random() * 1000;
    await new Promise((resolve) => setTimeout(resolve, buffer));
    return callFeatherless(systemPrompt, userMessage, apiKey);
  });
  featherlessQueue = myTurn.catch(() => {});
  return myTurn;
}

// ── Band.ai REST Helpers ───────────────────────────────────────

async function bandFetch(
  path: string,
  apiKey: string,
  options: RequestInit = {},
) {
  const url = `${BAND_API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
      ...options.headers,
    },
  });
  if (!res.ok) {
    if (res.status !== 404 && res.status !== 422) {
      const body = await res.text();
      console.warn(`Band API error (${res.status}): ${body}`);
    }
  }
  return res;
}

/** Get the next pending message across all chat rooms the agent is in. */
async function getNextMessage(apiKey: string) {
  const roomsRes = await bandFetch("/agent/chats", apiKey);
  if (!roomsRes.ok) return null;
  const roomsJson = await roomsRes.json();
  const rooms = roomsJson.data || [];

  for (const room of rooms) {
    const roomId = room.id || room.chat_room_id;
    if (!roomId) continue;

    const res = await bandFetch(`/agent/chats/${roomId}/messages/next`, apiKey);
    if (!res.ok) continue;
    if (res.status === 204) continue;

    let json;
    try {
      json = await res.json();
    } catch {
      continue;
    }
    if (json.data && json.data.id) {
      return json.data;
    }
  }

  return null;
}

/** Mark a message as being processed. */
async function markProcessing(messageId: string, apiKey: string) {
  await bandFetch(`/agent/messages/${messageId}/processing`, apiKey, {
    method: "POST",
  });
}

/** Mark a message as processed. */
async function markProcessed(messageId: string, apiKey: string) {
  await bandFetch(`/agent/messages/${messageId}/processed`, apiKey, {
    method: "POST",
  });
}

/** Send a message as the agent into a chat room. */
async function sendMessage(
  chatId: string,
  content: string,
  apiKey: string,
  mentionId?: string,
  mentionHandle?: string,
) {
  const body: any = { message: { content } };

  if (mentionId) {
    body.message.mentions = [{ id: mentionId }];
    if (mentionHandle && !content.includes(`@${mentionHandle}`)) {
      body.message.content = `@${mentionHandle} ${content}`;
    }
  }

  await bandFetch(`/agent/chats/${chatId}/messages`, apiKey, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ── Agent Execution ────────────────────────────────────────────

const SCRIBE_UUID = process.env.VITE_SCRIBE_UUID || "54b43fbc-65ee-4136-ab47-a85a11800233";
const PLANNER_UUID = process.env.VITE_PLANNER_UUID || "83095480-d94a-4085-a636-3d7e8c969500";
const PHARMA_UUID = process.env.VITE_PHARMACOLOGIST_UUID || "279ce17c-8983-4ca2-9f6b-2935d252135d";

const SCRIBE_HANDLE = "meetnorthern/scribeagent";
const PLANNER_HANDLE = "meetnorthern/planneragent";
const PHARMA_HANDLE = "meetnorthern/pharmacologistagent";

function extractJsonString(text: string): string {
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = text.match(jsonBlockRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  const startIdx = text.indexOf('{');
  const endIdx = text.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return text.substring(startIdx, endIdx + 1).trim();
  }
  return text;
}

async function processMessage(
  message: any,
  agent: AgentConfig,
  featherlessKey: string,
) {
  const { id: messageId, content, chat_id: chatId } = message;

  if (content && (content.includes("Prescriptions ready") || content.includes('"prescriptions"'))) {
    console.log(
      `[${agent.name}] Ignoring final prescription message to prevent infinite loop.`,
    );
    await markProcessed(messageId, agent.apiKey);
    return;
  }

  console.log(
    `[${agent.name}] Processing message: ${content?.slice(0, 80)}...`,
  );

  await markProcessing(messageId, agent.apiKey);

  try {
    let input = content?.replace(/@\S+/g, "").trim() || "";
    if (agent.name === "PlannerAgent" || agent.name === "PharmacologistAgent") {
      input = extractJsonString(input);
    }

    // Step 1: Call Featherless to get drug names (for all agents)
    const result = await callFeatherlessQueued(
      agent.systemPrompt,
      input,
      featherlessKey,
    );

    let finalResult = result;

    // Step 2: If this is the PharmacologistAgent, do FDA lookup
    if (agent.name === "PharmacologistAgent") {
      try {
        const parsed = JSON.parse(result);
        const drugNames = parsed.recommended_drugs || [];

        if (drugNames.length > 0) {
          console.log(
            `[${agent.name}] Drugs identified: ${drugNames.join(", ")}`,
          );
          console.log(`[${agent.name}] Searching FDA API for drug data...`);

          const fdaResults: any[] = [];
          for (const drugName of drugNames) {
            const fdaData = await lookupDrugOnFDA(drugName);
            if (fdaData.length > 0) {
              console.log(
                `[${agent.name}] Found FDA data for: ${drugName} (${fdaData.length} results)`,
              );
              fdaResults.push(...fdaData);
            }
          }

          // Step 3: Generate final prescriptions with FDA data
          console.log(
            `[${agent.name}] Generating prescriptions with FDA data...`,
          );
          const fdaContext = JSON.stringify(
            {
              patient_input: input,
              fda_drug_data: fdaResults,
            },
            null,
            2,
          );

          finalResult = await callFeatherlessQueued(
            PHARMA_FINAL_PROMPT,
            fdaContext,
            featherlessKey,
          );

          console.log(`[${agent.name}] Prescriptions generated with FDA data`);
        }
      } catch (parseErr: any) {
        console.warn(`[${agent.name}] FDA lookup error: ${parseErr.message}`);
        // Fall back to the original result
      }
    }

    // Post the result back to the chat room, mentioning the next agent in the pipeline
    let targetMentionId: string | undefined = undefined;
    let targetMentionHandle: string | undefined = undefined;
    let formattedResult = finalResult;

    if (agent.name === "ScribeAgent") {
      targetMentionId = PLANNER_UUID;
      targetMentionHandle = PLANNER_HANDLE;
      formattedResult = `Diagnostics complete. Please recommend treatments:\n\`\`\`json\n${finalResult}\n\`\`\``;
    } else if (agent.name === "PlannerAgent") {
      targetMentionId = PHARMA_UUID;
      targetMentionHandle = PHARMA_HANDLE;
      formattedResult = `Treatment plan ready. Please prescribe medications:\n\`\`\`json\n${finalResult}\n\`\`\``;
    } else if (agent.name === "PharmacologistAgent") {
      targetMentionId = SCRIBE_UUID;
      targetMentionHandle = SCRIBE_HANDLE;
      formattedResult = `Prescriptions ready (sourced from FDA API):\n\`\`\`json\n${finalResult}\n\`\`\``;
    } else {
      targetMentionId = message.sender_id;
      targetMentionHandle = message.sender_name;
    }

    await sendMessage(
      chatId,
      formattedResult,
      agent.apiKey,
      targetMentionId,
      targetMentionHandle,
    );

    await markProcessed(messageId, agent.apiKey);
    console.log(`[${agent.name}] ✓ Responded successfully`);
  } catch (err: any) {
    console.error(`[${agent.name}] ✗ Error:`, err.message);
    await bandFetch(`/agent/messages/${messageId}/failed`, agent.apiKey, {
      method: "POST",
    });
  }
}

// ── Main Loop ──────────────────────────────────────────────────

async function runAgent(agent: AgentConfig, featherlessKey: string) {
  console.log(`[${agent.name}] Starting agent loop...`);

  const identityRes = await bandFetch("/agent/me", agent.apiKey);
  if (!identityRes.ok) {
    console.error(
      `[${agent.name}] ✗ Failed to authenticate with Band.ai. Check API key.`,
    );
    return;
  }

  const identity = await identityRes.json();
  console.log(
    `[${agent.name}] ✓ Connected to Band as: ${identity.data?.name || identity.name || agent.name}`,
  );

  async function poll() {
    try {
      const message = await getNextMessage(agent.apiKey);
      if (message) {
        await processMessage(message, agent, featherlessKey);
      }
    } catch (err: any) {
      console.error(`[${agent.name}] Poll error:`, err.message);
    }
    setTimeout(poll, POLL_INTERVAL_MS);
  }

  poll();
}

// ── Startup ────────────────────────────────────────────────────

async function main() {
  const featherlessKey =
    process.env.FEATHERLESS_API_KEY || process.env.VITE_FEATHERLESS_API_KEY;
  if (!featherlessKey) {
    console.error(
      "Error: FEATHERLESS_API_KEY environment variable is required.",
    );
    process.exit(1);
  }

  const validAgents = AGENTS.filter((a) => a.apiKey);
  if (validAgents.length === 0) {
    console.error(
      "Error: No Band.ai agent API keys found. Set at least one of:\n" +
        "  BAND_SCRIBE_KEY, BAND_PLANNER_KEY, BAND_PHARMA_KEY",
    );
    process.exit(1);
  }

  console.log(
    `Starting ${validAgents.length} agent(s): ${validAgents.map((a) => a.name).join(", ")}`,
  );
  console.log("LLM Provider: Featherless.ai");
  console.log(`Model: ${MODEL}`);
  console.log("Drug Data: open.fda.gov (Drugs@FDA API)");
  console.log("");

  await Promise.all(
    validAgents.map((agent) => runAgent(agent, featherlessKey)),
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
