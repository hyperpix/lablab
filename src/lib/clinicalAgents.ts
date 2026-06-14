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
Recommend safe prescriptions (analgesics, antibiotics, mouthwashes) matching the diagnostics and treatment plan.
Cross-reference the patient's drug history, allergies, and general medical profile to ensure safety.

Output Format (strict JSON only):
{
  "prescriptions": [
    { 
      "name": "Amoxicillin 500mg", 
      "dosage": "1 capsule", 
      "frequency": "Every 8 hours", 
      "duration": "5 days", 
      "warning": "",
      "reason": "For prophylaxis / infection control post-extraction"
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
 * Log an agent execution to Band.ai via the Human API.
 * Creates a chat room message that the agent-runner can pick up.
 */
async function logToBand(
  agentName: string,
  agentHandle: string,
  agentId: string | undefined,
  bandApiKey: string,
  patientId: string,
  input: any,
  output: any,
) {
  if (!bandApiKey || !agentHandle) return;
  const isAgent = bandApiKey.startsWith("band_a_");
  try {
    const roomName = `dental-scribe-${patientId}`;

    // Create or find a chat room for this patient
    const chatsUrl = isAgent ? `${BAND_API}/agent/chats` : `${BAND_API}/me/chats`;
    const roomRes = await fetch(chatsUrl, {
      headers: { "X-API-Key": bandApiKey },
    });
    const rooms = await roomRes.json();
    const chatList = isAgent ? (rooms.data || []) : (rooms.data?.chats || rooms.chats || []);
    let roomId = chatList.find((c: any) => (c.title || c.name || "").toLowerCase() === roomName.toLowerCase())?.id;

    if (!roomId) {
      // Create a new room
      const createUrl = isAgent ? `${BAND_API}/agent/chats` : `${BAND_API}/me/chats`;
      const body = isAgent
        ? { chat: { title: roomName } }
        : { name: roomName, description: `Dental scribe session for patient ${patientId}` };

      const createRes = await fetch(createUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": bandApiKey,
        },
        body: JSON.stringify(body),
      });
      const created = await createRes.json();
      roomId = created.data?.id || created.id;
    }

    // Ensure the agent is added as a participant to the room
    if (roomId && agentId) {
      try {
        const addParticipantUrl = isAgent
          ? `${BAND_API}/agent/chats/${roomId}/participants`
          : `${BAND_API}/me/chats/${roomId}/participants`;
        await fetch(addParticipantUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": bandApiKey,
          },
          body: JSON.stringify({
            participant: { participant_id: agentId },
            participant_id: agentId
          }),
        });
      } catch (addErr) {
        console.warn("Failed to add agent participant in logToBand:", addErr);
      }
    }

    // Send the result as a message @mention-ing the next agent
    const msgUrl = isAgent ? `${BAND_API}/agent/chats/${roomId}/messages` : `${BAND_API}/me/chats/${roomId}/messages`;
    const content = `@${agentHandle} Results for patient ${patientId}:\n\nInput:\n${JSON.stringify(input, null, 2)}\n\nOutput:\n${JSON.stringify(output, null, 2)}`;
    const body = isAgent
      ? {
          message: {
            content,
            mentions: agentId ? [{ id: agentId }] : []
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

  const isAgent = keys.band?.startsWith("band_a_");

  // Try to create/find the chat room on Band.ai first
  if (keys.band) {
    if (onStep) onStep("Connecting to Band.ai chat room...", 10);
    try {
      const roomName = `Dental-Scribe-${patientId || "unknown"}-${Date.now().toString(36)}`;
      const chatsUrl = isAgent ? `${BAND_API}/agent/chats` : `${BAND_API}/me/chats`;
      const roomRes = await fetch(chatsUrl, {
        headers: { "X-API-Key": keys.band },
      });
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
            "X-API-Key": keys.band,
          },
          body: JSON.stringify(body),
        });
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

        for (const [role, agentUuid] of Object.entries(uuids)) {
          if (!agentUuid) continue;
          try {
            await fetch(addParticipantUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-Key": keys.band,
              },
              body: JSON.stringify({
                participant: { participant_id: agentUuid },
                participant_id: agentUuid
              }),
            });
          } catch (addErr) {
            console.warn(`Failed to add agent ${role} (${agentUuid}) to chat room:`, addErr);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to find or create Band.ai room:", err);
    }
  }

  // Define default handles if not specified
  const scribeHandle = handles?.scribe || "ScribeAgent";
  const plannerHandle = handles?.planner || "PlannerAgent";
  const pharmacologistHandle = handles?.pharmacologist || "PharmacologistAgent";

  // If Band room is successfully found, execute remote Band mode
  if (keys.band && roomId) {
    try {
      // 1. Scribe Agent via Band.ai
      if (onStep) onStep("ScribeAgent: Sending dictation to Band.ai...", 15);
      const scribeOutputRaw = await callAgentViaBand(
        roomId,
        scribeHandle,
        uuids.scribe,
        transcript,
        keys.band,
        onStep,
        20
      );
      const diagnostics: DiagnosticsData = cleanAndParseJSON(scribeOutputRaw);

      // 2. Planner Agent via Band.ai
      if (onStep) onStep("PlannerAgent: Submitting diagnostics to Band.ai...", 40);
      const plannerOutputRaw = await callAgentViaBand(
        roomId,
        plannerHandle,
        uuids.planner,
        JSON.stringify(diagnostics),
        keys.band,
        onStep,
        45
      );
      const plannerResult = cleanAndParseJSON(plannerOutputRaw);

      // 3. Pharmacologist Agent via Band.ai
      if (onStep) onStep("PharmacologistAgent: Sending treatment plan to Band.ai...", 60);
      const pharmaInput = { diagnostics, treatments: plannerResult.treatments };
      const pharmaOutputRaw = await callAgentViaBand(
        roomId,
        pharmacologistHandle,
        uuids.pharmacologist,
        JSON.stringify(pharmaInput),
        keys.band,
        onStep,
        65
      );
      const pharmaResult = cleanAndParseJSON(pharmaOutputRaw);

      return {
        diagnostics,
        investigations: plannerResult.investigations || [],
        treatments: plannerResult.treatments || [],
        prescriptions: pharmaResult.prescriptions || [],
        teeth_marks: plannerResult.teeth_marks || [],
      };
    } catch (bandError) {
      console.warn("Band.ai remote workflow failed or timed out. Falling back to direct mode...", bandError);
      if (onStep) onStep("Band.ai remote error. Falling back to Direct mode...", 12);
    }
  }

  // ---- DIRECT FEATHERLESS MODE (FALLBACK) ----
  // 1. Scribe Agent
  if (onStep) onStep("ScribeAgent: Synthesizing diagnostics using Llama 3 8B...", 20);
  const scribeOutputRaw = await callFeatherlessQueued(
    SCRIBE_PROMPT,
    transcript,
    keys.featherless,
    SCRIBE_MODEL,
  );
  const diagnostics: DiagnosticsData = cleanAndParseJSON(scribeOutputRaw);

  if (onStep) onStep("ScribeAgent: Logging telemetry to Band.ai...", 30);
  await logToBand(
    "ScribeAgent",
    scribeHandle,
    uuids.scribe,
    keys.band || "",
    patientId || "unknown",
    { transcript },
    diagnostics,
  );

  // 2. Planner Agent
  if (onStep) onStep("PlannerAgent: Drafting treatment plan options using Qwen 2.5 7B...", 45);
  const plannerOutputRaw = await callFeatherlessQueued(
    PLANNER_PROMPT,
    JSON.stringify(diagnostics),
    keys.featherless,
    PLANNER_MODEL,
  );
  const plannerResult = cleanAndParseJSON(plannerOutputRaw);

  if (onStep) onStep("PlannerAgent: Logging telemetry to Band.ai...", 55);
  await logToBand(
    "PlannerAgent",
    plannerHandle,
    uuids.planner,
    keys.band || "",
    patientId || "unknown",
    diagnostics,
    plannerResult,
  );

  // 3. Pharmacologist Agent
  if (onStep) onStep("PharmacologistAgent: Safety-checking prescriptions using Qwen 2.5 7B...", 60);
  const pharmaInput = { diagnostics, treatments: plannerResult.treatments };
  const pharmaOutputRaw = await callFeatherlessQueued(
    PHARMACOLOGIST_PROMPT,
    JSON.stringify(pharmaInput),
    keys.featherless,
    PHARMACOLOGIST_MODEL,
  );
  const pharmaResult = cleanAndParseJSON(pharmaOutputRaw);

  if (onStep) onStep("PharmacologistAgent: Logging telemetry to Band.ai...", 68);
  await logToBand(
    "PharmacologistAgent",
    pharmacologistHandle,
    uuids.pharmacologist,
    keys.band || "",
    patientId || "unknown",
    pharmaInput,
    pharmaResult,
  );

  return {
    diagnostics,
    investigations: plannerResult.investigations || [],
    treatments: plannerResult.treatments || [],
    prescriptions: pharmaResult.prescriptions || [],
    teeth_marks: plannerResult.teeth_marks || [],
  };
}
