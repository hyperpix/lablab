/**
 * clinicalAgents.ts
 * Multi-agent clinical workflow orchestrator for Dently.
 *
 * Modes:
 *   - Direct (default):  Calls Featherless.ai directly for LLM inference.
 *   - Band (optional):   Also sends/receives messages through Band.ai chat rooms
 *                        when agent API keys are configured. The agent-runner service
 *                        processes Band messages using Featherless.
 *
 * Powered by Featherless.ai (LLM Inference) and Band.ai (Agent Mesh).
 */

import OpenAI from "openai";

function cleanKey(key?: string): string {
  if (!key) return "";
  return key.replace(/^['"]|['"]$/g, "").trim();
}

export interface DiagnosticsData {
  chief_complaint: string;
  medical_history_notes: string;
  other_conditions: string;
  drug_history: string;
  clinical_findings: string;
  investigation_notes: string;
  diagnosis_notes: string;
}

export interface TeethMark {
  tooth_iso: number;
  condition:
    | "sound"
    | "compromised"
    | "endo"
    | "filled"
    | "missing"
    | "rotated"
    | "gum-recessed"
    | "displaced";
  notes?: string;
}

export interface ClinicalWorkflowResult {
  diagnostics: DiagnosticsData;
  investigations: string[];
  treatments: Array<{ description: string; tooth: string; phase: string }>;
  prescriptions: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    warning?: string;
    reason?: string;
  }>;
  teeth_marks?: TeethMark[];
}

// ---- Agent Prompts ----

const SCRIBE_PROMPT = `
You are a specialized Dental Scribe Agent.
Your job is to parse unstructured clinical transcripts/audio dictations and return a strictly structured JSON containing the 7 clinical sections.

CRITICAL INSTRUCTION: To prevent hallucinations, ONLY include information explicitly stated in the transcript. If a section (such as medical history, other conditions, drug history/allergies, or investigation notes) is not mentioned or addressed in the transcript, set its value strictly to "None reported" or "Not mentioned". DO NOT assume, invent, or fill in any details not present in the transcript.

Output Format (strict JSON only):
{
  "chief_complaint": "Extracted chief complaint...",
  "medical_history_notes": "Patient medical history...",
  "other_conditions": "Other conditions...",
  "drug_history": "Allergies or current medications...",
  "clinical_findings": "Clinical findings...",
  "investigation_notes": "Any investigations (radiographs, etc.)...",
  "diagnosis_notes": "Final diagnosis..."
}
`;

const PLANNER_PROMPT = `
You are a Dental Treatment Planner Agent.
Based on the provided diagnostics JSON, recommend:
1. Investigations to conduct (e.g., radiographs, CBCT).
2. Dental treatment procedures to perform, including teeth numbers if specified, and logical phase (e.g., Phase 1: Emergency, Phase 2: Restorative).
3. Visual teeth chart markings that need to be made.

Supported conditions: 'compromised', 'endo', 'filled', 'missing', 'rotated', 'gum-recessed', 'displaced', 'sound'.

Output Format (strict JSON only):
{
  "investigations": ["Investigation 1", "Investigation 2"],
  "treatments": [
    { "description": "Procedure name", "tooth": "36", "phase": "Phase 2 - Restorative" }
  ],
  "teeth_marks": [
    { "tooth_iso": 36, "condition": "compromised", "notes": "Deep carious lesion on distal-occlusal" }
  ]
}
`;

const PHARMACOLOGIST_PROMPT = `
You are a Dental Pharmacologist Agent.
Based on the diagnostics and treatment plan, identify what medications are needed.
Consider the patient's allergies, medical history, and current medications.

Output ONLY a JSON object with an array of drug names (generic names preferred):
{
  "recommended_drugs": ["Ibuprofen", "Amoxicillin", "Chlorhexidine gluconate"]
}
`;

const PHARMA_FINAL_PROMPT = `
You are a Dental Pharmacologist Agent. You are given FDA-sourced drug data for medications to prescribe. Using the real drug information (brand names, active ingredients, dosage forms, routes, marketing status), generate the final prescription details.

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
}
`;

// ---- Featherless LLM ----

const FEATHERLESS_BASE = "https://api.featherless.ai/v1";

// Optimized warm models for each specialized role
const SCRIBE_MODEL = "Qwen/Qwen2.5-7B-Instruct";
const PLANNER_MODEL = "Qwen/Qwen2.5-7B-Instruct";
const PHARMACOLOGIST_MODEL = "Qwen/Qwen2.5-7B-Instruct";

function createFeatherlessClient(apiKey: string): OpenAI {
  return new OpenAI({
    baseURL: FEATHERLESS_BASE,
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

async function callFeatherless(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  model: string,
  retries = 4,
  delayMs = 1500
): Promise<string> {
  const client = createFeatherlessClient(apiKey);
  for (let i = 0; i < retries; i++) {
    try {
      const response = await client.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      });
      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("Featherless API returned an empty response");
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
  userPrompt: string,
  apiKey: string,
  model: string,
): Promise<string> {
  const myTurn = featherlessQueue.then(async () => {
    const buffer = 800 + Math.random() * 1000;
    await new Promise((resolve) => setTimeout(resolve, buffer));
    return callFeatherless(systemPrompt, userPrompt, apiKey, model);
  });
  featherlessQueue = myTurn.catch(() => {});
  return myTurn;
}

function cleanAndParseJSON(text: string): any {
  // Try direct parsing first
  try {
    return JSON.parse(text.trim());
  } catch (e) {}

  // Try extracting content inside ```json ... ``` or ``` ... ```
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = text.match(jsonBlockRegex);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch (e) {}
  }

  // Find the first '{' and last '}'
  const startIdx = text.indexOf('{');
  const endIdx = text.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const jsonCandidate = text.substring(startIdx, endIdx + 1);
    try {
      return JSON.parse(jsonCandidate.trim());
    } catch (e) {}
  }

  throw new Error(`Failed to parse JSON from LLM response: ${text}`);
}

// ---- Band.ai Integration ----
// Band uses chat rooms + @mentions for agent coordination.
// When band keys are provided, the workflow logs executions to Band
// and can optionally trigger the agent-runner service.

const BAND_API = "/api/band";

/**
 * Look up a drug on the FDA Drugs@FDA API and return structured info.
 */
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

/**
 * Log an agent execution to Band.ai.
 * Directly posts a message to the specified room.
 */
async function logToBand(
  roomId: string,
  bandApiKey: string,
  patientId: string,
  contentPrefix: string,
  output: any,
  nextAgentHandle?: string,
  nextAgentId?: string,
) {
  if (!bandApiKey || !roomId) return;
  const isAgent = bandApiKey.startsWith("band_a_");
  try {
    const msgUrl = isAgent ? `${BAND_API}/agent/chats/${roomId}/messages` : `${BAND_API}/me/chats/${roomId}/messages`;
    
    let content = "";
    if (nextAgentHandle) {
      content = `@${nextAgentHandle} Here is the ${contentPrefix} data:\n\n${JSON.stringify(output, null, 2)}`;
    } else {
      content = `Workflow completed. Final ${contentPrefix} data:\n\n${JSON.stringify(output, null, 2)}`;
    }

    const body = isAgent
      ? {
          message: {
            content,
            mentions: nextAgentId ? [{ id: nextAgentId }] : []
          }
        }
      : { content };

    await fetch(msgUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": bandApiKey,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn("Band.ai logging failed:", err);
  }
}

// ---- Main Orchestration ----

export interface WorkflowKeys {
  featherless: string;
  band?: string;
  bandScribe?: string;
  bandPlanner?: string;
  bandPharma?: string;
}

export interface AgentUuids {
  scribe: string;
  planner: string;
  pharmacologist: string;
}

export interface BandAgentHandles {
  scribe?: string;
  planner?: string;
  pharmacologist?: string;
}

/**
 * Call a remote Band.ai agent.
 * Posts an input message to a patient's chat room, @mentioning the agent's handle.
 * Then, polls the chat room for a JSON response from that agent.
 */
async function callAgentViaBand(
  roomId: string,
  agentHandle: string,
  agentId: string,
  inputMessage: string,
  bandApiKey: string,
  onStep?: (label: string, value: number) => void,
  progressVal: number = 0,
): Promise<string> {
  const isAgent = bandApiKey.startsWith("band_a_");
  const url = isAgent
    ? `${BAND_API}/agent/chats/${roomId}/messages`
    : `${BAND_API}/me/chats/${roomId}/messages`;
  
  const body = isAgent
    ? {
        message: {
          content: `@${agentHandle} process this clinical input:\n${inputMessage}`,
          mentions: [{ id: agentId }]
        }
      }
    : { content: `@${agentHandle} process this clinical input:\n${inputMessage}` };

  // Post the message to trigger the agent runner
  const postRes = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": bandApiKey,
    },
    body: JSON.stringify(body),
  });
  
  if (!postRes.ok) {
    const errorText = await postRes.text();
    throw new Error(`Failed to post input message to Band.ai room: ${errorText}`);
  }

  // Poll for the agent's response
  const startTime = Date.now() - 5000; // 5s buffer for server time skew
  const timeoutMs = 90000; // 90 second timeout for remote agent execution
  let pollAttempt = 0;

  const pollUrl = isAgent
    ? `${BAND_API}/agent/chats/${roomId}/messages`
    : `${BAND_API}/me/chats/${roomId}/messages`;

  while (Date.now() - startTime < timeoutMs) {
    pollAttempt++;
    if (onStep) {
      onStep(`Waiting for @${agentHandle} response from Band.ai (attempt ${pollAttempt})...`, progressVal);
    }
    
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const res = await fetch(pollUrl, {
      headers: { "X-API-Key": bandApiKey },
    });
    if (!res.ok) continue;

    const json = await res.json();
    const messages = isAgent
      ? (Array.isArray(json.data) ? json.data : (json.data?.messages || json.messages || []))
      : (json.data?.messages || json.messages || []);

    // Search for a message containing valid JSON that was posted after our starting time.
    for (const msg of messages) {
      const msgTime = new Date(msg.created_at || msg.inserted_at).getTime();
      if (msgTime > startTime) {
        const content = msg.content || "";
        const cleaned = content.replace(/@\S+/g, "").trim();
        if (cleaned.includes("{") && cleaned.includes("}")) {
          try {
            cleanAndParseJSON(cleaned);
            return cleaned; // Successfully parsed valid JSON response!
          } catch (e) {
            // Not a complete or valid JSON response yet, keep polling
          }
        }
      }
    }
  }
  throw new Error(`Timeout waiting for @${agentHandle} response on Band.ai. Make sure your background agent-runner is running.`);
}

/**
 * Poll for an agent's response in the chat room.
 */
async function waitForAgentResponse(
  roomId: string,
  agentHandle: string,
  bandApiKey: string,
  startTime: number,
  onStep?: (label: string, value: number) => void,
  progressVal: number = 0,
): Promise<string> {
  const isAgent = bandApiKey.startsWith("band_a_");
  const timeoutMs = 90000; // 90 second timeout for remote agent execution
  let pollAttempt = 0;

  const pollUrl = isAgent
    ? `${BAND_API}/agent/chats/${roomId}/messages`
    : `${BAND_API}/me/chats/${roomId}/messages`;

  while (Date.now() - startTime < timeoutMs) {
    pollAttempt++;
    if (onStep) {
      onStep(`Waiting for @${agentHandle} response from Band.ai (attempt ${pollAttempt})...`, progressVal);
    }
    
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const res = await fetch(pollUrl, {
      headers: { "X-API-Key": bandApiKey },
    });
    if (!res.ok) continue;

    const json = await res.json();
    const messages = isAgent
      ? (Array.isArray(json.data) ? json.data : (json.data?.messages || json.messages || []))
      : (json.data?.messages || json.messages || []);

    // Search for a message containing valid JSON that was posted after our starting time.
    for (const msg of messages) {
      const msgTime = new Date(msg.created_at || msg.inserted_at).getTime();
      if (msgTime > startTime) {
        const content = msg.content || "";
        const cleaned = content.replace(/@\S+/g, "").trim();
        if (cleaned.includes("{") && cleaned.includes("}")) {
          try {
            cleanAndParseJSON(cleaned);
            return cleaned; // Successfully parsed valid JSON response!
          } catch (e) {
            // Not a complete or valid JSON response yet, keep polling
          }
        }
      }
    }
  }
  throw new Error(`Timeout waiting for @${agentHandle} response on Band.ai. Make sure your background agent-runner is running.`);
}

/**
 * Run the 3-agent clinical workflow.
 *
 * @param transcript - Raw clinical transcript/dictation text
 * @param keys - API keys for Featherless (required) and Band (optional)
 * @param uuids - Agent UUIDs registered on Band.ai
 * @param handles - Optional Band.ai agent handles for @mention routing
 * @param patientId - Optional patient ID for Band room naming
 */
export async function runClinicalWorkflow(
  transcript: string,
  keys: WorkflowKeys,
  uuids: AgentUuids,
  handles?: BandAgentHandles,
  patientId?: string,
  onStep?: (label: string, value: number) => void,
): Promise<ClinicalWorkflowResult> {
  let roomId = "";

  const bandKey = cleanKey(keys.bandScribe || keys.band);
  const featherlessKey = cleanKey(keys.featherless);
  const isAgent = bandKey.startsWith("band_a_");

  const resolvedUuids = {
    scribe: uuids.scribe || "54b43fbc-65ee-4136-ab47-a85a11800233",
    planner: uuids.planner || "83095480-d94a-4085-a636-3d7e8c969500",
    pharmacologist: uuids.pharmacologist || "279ce17c-8983-4ca2-9f6b-2935d252135d"
  };

  const scribeHandle = handles?.scribe || "ScribeAgent";
  const plannerHandle = handles?.planner || "PlannerAgent";
  const pharmacologistHandle = handles?.pharmacologist || "PharmacologistAgent";

  // Try to create/find the chat room on Band.ai first
  if (bandKey) {
    if (onStep) onStep("Connecting to Band.ai chat room...", 10);
    try {
      const roomName = `Dental-Scribe-${patientId || "unknown"}-${Date.now().toString(36)}`;
      const chatsUrl = isAgent ? `${BAND_API}/agent/chats` : `${BAND_API}/me/chats`;
      const roomRes = await fetch(chatsUrl, {
        headers: { "X-API-Key": bandKey },
      });
      if (!roomRes.ok) {
        throw new Error(`Failed to list rooms (${roomRes.status}): ${await roomRes.text()}`);
      }
      const rooms = await roomRes.json();
      const chatList = isAgent ? (rooms.data || []) : (rooms.data?.chats || rooms.chats || []);
      let room = chatList.find((c: any) => (c.title || c.name || "").toLowerCase() === roomName.toLowerCase());
      
      if (!room) {
        const createUrl = isAgent ? `${BAND_API}/agent/chats` : `${BAND_API}/me/chats`;
        const body = isAgent
          ? { chat: { title: roomName } }
          : { name: roomName, description: `Dental scribe session for patient ${patientId || "unknown"}` };

        const createRes = await fetch(createUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": bandKey,
          },
          body: JSON.stringify(body),
        });
        if (!createRes.ok) {
          throw new Error(`Failed to create room (${createRes.status}): ${await createRes.text()}`);
        }
        const created = await createRes.json();
        roomId = created.data?.id || created.id;
      } else {
        roomId = room.id;
      }

      // Ensure Scribe, Planner, and Pharmacologist are in the chat room
      if (roomId) {
        const addParticipantUrl = isAgent
          ? `${BAND_API}/agent/chats/${roomId}/participants`
          : `${BAND_API}/me/chats/${roomId}/participants`;

        for (const [role, agentUuid] of Object.entries(resolvedUuids)) {
          if (!agentUuid) continue;
          try {
            const addRes = await fetch(addParticipantUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-Key": bandKey,
              },
              body: JSON.stringify({
                participant: { participant_id: agentUuid }
              }),
            });
            if (!addRes.ok) {
              console.warn(`Failed to add agent ${role} (${agentUuid}) to chat room:`, await addRes.text());
            }
          } catch (addErr) {
            console.warn(`Failed to add agent ${role} (${agentUuid}) to chat room:`, addErr);
          }
        }
      }
    } catch (err: any) {
      console.warn("Failed to find or create Band.ai room:", err);
      if (onStep) onStep(`Failed to connect to Band: ${err.message || err}`, 10);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // 1. Scribe Agent
  const scribeApiKey = cleanKey(keys.bandScribe || bandKey);

  if (roomId) {
    if (onStep) onStep("ScribeAgent: Posting raw transcript to Band.ai...", 15);
    await logToBand(
      roomId,
      scribeApiKey,
      patientId || "unknown",
      "Raw Transcript",
      { transcript }
    );
  }

  if (onStep) onStep("ScribeAgent: Parsing transcript into diagnostics...", 25);
  const scribeOutputRaw = await callFeatherlessQueued(
    SCRIBE_PROMPT,
    transcript,
    featherlessKey,
    SCRIBE_MODEL,
  );
  const diagnostics: DiagnosticsData = cleanAndParseJSON(scribeOutputRaw);

  if (roomId) {
    if (onStep) onStep("ScribeAgent: Sending diagnostics to Band.ai...", 35);
    await logToBand(
      roomId,
      scribeApiKey,
      patientId || "unknown",
      "Diagnostics",
      diagnostics,
      plannerHandle,
      resolvedUuids.planner
    );
  }

  // 2. Planner Agent
  if (onStep) onStep("PlannerAgent: Formulating treatment plans...", 50);
  const plannerOutputRaw = await callFeatherlessQueued(
    PLANNER_PROMPT,
    JSON.stringify(diagnostics),
    featherlessKey,
    PLANNER_MODEL,
  );
  const plannerResult = cleanAndParseJSON(plannerOutputRaw);

  if (roomId) {
    if (onStep) onStep("PlannerAgent: Sending treatment plans to Band.ai...", 65);
    const plannerApiKey = cleanKey(keys.bandPlanner || bandKey);
    await logToBand(
      roomId,
      plannerApiKey,
      patientId || "unknown",
      "Treatment Plan",
      plannerResult,
      pharmacologistHandle,
      resolvedUuids.pharmacologist
    );
  }

  // 3. Pharmacologist Agent
  if (onStep) onStep("PharmacologistAgent: Safety-checking prescriptions...", 75);
  const pharmaInput = { diagnostics, treatments: plannerResult.treatments };
  const drugListRaw = await callFeatherlessQueued(
    PHARMACOLOGIST_PROMPT,
    JSON.stringify(pharmaInput),
    featherlessKey,
    PHARMACOLOGIST_MODEL,
  );
  const drugList = cleanAndParseJSON(drugListRaw);

  const drugsToLookup = drugList.recommended_drugs || [];
  const fdaDataList: any[] = [];
  for (const d of drugsToLookup) {
    const results = await lookupDrugOnFDA(d);
    if (results && results.length > 0) {
      fdaDataList.push(results[0]);
    }
  }

  if (onStep) onStep("PharmacologistAgent: Writing final prescriptions using FDA data...", 85);
  const finalPharmaInput = {
    diagnostics,
    treatments: plannerResult.treatments,
    fda_drug_data: fdaDataList
  };
  const pharmaOutputRaw = await callFeatherlessQueued(
    PHARMA_FINAL_PROMPT,
    JSON.stringify(finalPharmaInput),
    featherlessKey,
    PHARMACOLOGIST_MODEL,
  );
  const pharmaResult = cleanAndParseJSON(pharmaOutputRaw);

  if (roomId) {
    if (onStep) onStep("PharmacologistAgent: Sending prescriptions to Band.ai...", 95);
    const pharmaApiKey = cleanKey(keys.bandPharma || bandKey);
    await logToBand(
      roomId,
      pharmaApiKey,
      patientId || "unknown",
      "Prescriptions",
      pharmaResult
    );
  }

  return {
    diagnostics,
    investigations: plannerResult.investigations || [],
    treatments: plannerResult.treatments || [],
    prescriptions: pharmaResult.prescriptions || [],
    teeth_marks: plannerResult.teeth_marks || [],
  };
}
