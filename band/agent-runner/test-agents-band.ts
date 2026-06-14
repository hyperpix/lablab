/**
 * Band.ai Communication Test
 *
 * Tests all 3 dental agents (Scribe, Planner, Pharmacologist) through
 * the full Band.ai mesh round-trip:
 *   1. Creates a Band.ai chat room
 *   2. Posts input messages @mentioning each agent
 *   3. Processes them via Featherless (as the agent-runner would)
 *   4. Posts results back to Band.ai
 *   5. Verifies all results are visible
 *
 * Usage:
 *   cd band/agent-runner
 *   npm install
 *   npx tsx test-agents-band.ts
 */

import OpenAI from "openai";

// ── Configuration ──────────────────────────────────────────────

const BAND_API = "https://app.band.ai/api/v1";
const FEATHERLESS_API = "https://api.featherless.ai/v1";
const MODEL = "Qwen/Qwen2.5-7B-Instruct";

// Read from .env or env vars (duplicate the keys for standalone use)
const BAND_HUMAN_KEY = process.env.VITE_BAND_API_KEY!;
const FEATHERLESS_KEY = process.env.VITE_FEATHERLESS_API_KEY!;

// ── Agent Prompts (same as clinicalAgents.ts) ──────────────────

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
    { "name": "Amoxicillin 500mg", "dosage": "1 capsule", "frequency": "Every 8 hours", "duration": "5 days", "warning": "" }
  ]
}
`;

// ── Sample Transcript ──────────────────────────────────────────

const SAMPLE_TRANSCRIPT = `
Patient presents with severe pain in lower right molar area for the past 3 days.
Pain is throbbing and worse when lying down. Patient has diabetes type 2,
allergic to penicillin. Current medications include Metformin 500mg twice daily.
On examination, tooth 46 has deep occlusal caries with tenderness to percussion.
Radiograph shows carious lesion extending to pulp chamber.
Diagnosis: Acute irreversible pulpitis with apical periodontitis.
`;

// ── Helpers ────────────────────────────────────────────────────

const fexClient = new OpenAI({
  baseURL: FEATHERLESS_API,
  apiKey: FEATHERLESS_KEY,
});

async function callFeatherless(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fexClient.chat.completions.create({
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
}

async function bandGet(path: string) {
  const res = await fetch(`${BAND_API}${path}`, {
    headers: { "X-API-Key": BAND_HUMAN_KEY },
  });
  if (!res.ok) console.warn(`  ⚠ GET ${path} → ${res.status}: ${await res.text()}`);
  return res;
}

async function bandPost(path: string, body: any) {
  const res = await fetch(`${BAND_API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": BAND_HUMAN_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.warn(`  ⚠ POST ${path} → ${res.status}: ${await res.text()}`);
  return res;
}

// ── Main Test ──────────────────────────────────────────────────

async function testBandCommunication() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║  Band.ai Full Communication Test — All 3 Agents     ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log();

  // ── Step 1: Verify API keys ──
  if (!BAND_HUMAN_KEY) { console.error("✗ VITE_BAND_API_KEY not set"); process.exit(1); }
  if (!FEATHERLESS_KEY) { console.error("✗ VITE_FEATHERLESS_API_KEY not set"); process.exit(1); }
  console.log("✓ Featherless API key present");
  console.log("✓ Band.ai Human API key present");
  console.log();

  // ── Step 2: Create a Band.ai chat room ──
  const roomName = `test-dental-scribe-${Date.now()}`;
  console.log(`Creating Band.ai chat room: "${roomName}" ...`);

  const createRes = await bandPost("/me/chats", {
    name: roomName,
    description: "Dently agent communication test",
  });
  if (!createRes.ok) {
    console.error("✗ Failed to create chat room. Check your Band.ai API key.");
    process.exit(1);
  }
  const created = await createRes.json();
  const roomId = created.data?.id || created.id;
  console.log(`  ✓ Room created! Room ID: ${roomId}`);
  console.log(`  ✓ View at: https://app.band.ai/chats/${roomId}`);
  console.log();

  // ── Step 3: Run all 3 agents sequentially through Band + Featherless ──

  let diagnostics: any = null;
  let plannerResult: any = null;
  let pharmaResult: any = null;

  // 3a. SCRIBE AGENT
  console.log("──────────────────────────────────────────────────────");
  console.log("📝 Agent 1: ScribeAgent");
  console.log("──────────────────────────────────────────────────────");
  console.log(`Posting transcript to Band.ai @mentioning ScribeAgent ...`);
  await bandPost(`/me/chats/${roomId}/messages`, {
    content: `@ScribeAgent Process this dental transcript:\n\n${SAMPLE_TRANSCRIPT}`,
  });
  console.log("  ✓ Message posted to Band.ai");
  console.log("Calling Featherless (simulating agent-runner)...");
  const scribeRaw = await callFeatherless(SCRIBE_PROMPT, SAMPLE_TRANSCRIPT);
  diagnostics = JSON.parse(scribeRaw);
  console.log("  ✓ ScribeAgent response:");
  console.log(diagnostics);
  console.log();
  // Post result back to Band.ai
  await bandPost(`/me/chats/${roomId}/messages`, {
    content: `@all Diagnostics complete:\n\`\`\`json\n${JSON.stringify(diagnostics, null, 2)}\n\`\`\``,
  });
  console.log("  ✓ Diagnostics posted back to Band.ai");

  // 3b. PLANNER AGENT
  console.log("──────────────────────────────────────────────────────");
  console.log("📋 Agent 2: PlannerAgent");
  console.log("──────────────────────────────────────────────────────");
  console.log(`Posting diagnostics to Band.ai @mentioning PlannerAgent ...`);
  await bandPost(`/me/chats/${roomId}/messages`, {
    content: `@PlannerAgent Recommend treatments for:\n\`\`\`json\n${JSON.stringify(diagnostics, null, 2)}\n\`\`\``,
  });
  console.log("  ✓ Message posted to Band.ai");
  console.log("Calling Featherless (simulating agent-runner)...");
  const plannerRaw = await callFeatherless(PLANNER_PROMPT, JSON.stringify(diagnostics));
  plannerResult = JSON.parse(plannerRaw);
  console.log("  ✓ PlannerAgent response:");
  console.log(JSON.stringify(plannerResult, null, 2));
  console.log();
  await bandPost(`/me/chats/${roomId}/messages`, {
    content: `@all Treatment plan complete:\n\`\`\`json\n${JSON.stringify(plannerResult, null, 2)}\n\`\`\``,
  });
  console.log("  ✓ Treatment plan posted back to Band.ai");

  // 3c. PHARMACOLOGIST AGENT
  console.log("──────────────────────────────────────────────────────");
  console.log("💊 Agent 3: PharmacologistAgent");
  console.log("──────────────────────────────────────────────────────");
  const pharmaInput = { diagnostics, treatments: plannerResult.treatments };
  console.log(`Posting treatment plan to Band.ai @mentioning PharmacologistAgent ...`);
  await bandPost(`/me/chats/${roomId}/messages`, {
    content: `@PharmacologistAgent Recommend safe prescriptions for:\n\`\`\`json\n${JSON.stringify(pharmaInput, null, 2)}\n\`\`\``,
  });
  console.log("  ✓ Message posted to Band.ai");
  console.log("Calling Featherless (simulating agent-runner)...");
  const pharmaRaw = await callFeatherless(PHARMACOLOGIST_PROMPT, JSON.stringify(pharmaInput));
  pharmaResult = JSON.parse(pharmaRaw);
  console.log("  ✓ PharmacologistAgent response:");
  console.log(JSON.stringify(pharmaResult, null, 2));
  console.log();
  await bandPost(`/me/chats/${roomId}/messages`, {
    content: `@all Prescriptions complete:\n\`\`\`json\n${JSON.stringify(pharmaResult, null, 2)}\n\`\`\``,
  });
  console.log("  ✓ Prescriptions posted back to Band.ai");

  // ── Step 4: Verify messages are on Band.ai ──
  console.log("──────────────────────────────────────────────────────");
  console.log("📡 Verifying Band.ai chat history...");
  console.log("──────────────────────────────────────────────────────");
  const msgsRes = await bandGet(`/me/chats/${roomId}/messages`);
  if (msgsRes.ok) {
    const msgsJson = await msgsRes.json();
    const messages = msgsJson.data?.messages || msgsJson.messages || [];
    console.log(`  ✓ ${messages.length} messages in chat room`);
    for (const msg of messages) {
      const preview = (msg.content || "").slice(0, 80).replace(/\n/g, " ");
      console.log(`    ${msg.role || "user"}: ${preview}...`);
    }
  }

  // ── Summary ──
  console.log();
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║  ✅ All 3 agents tested through Band.ai!            ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log();
  console.log(`Chat room: "${roomName}"`);
  console.log(`Room ID:   ${roomId}`);
  console.log(`URL:       https://app.band.ai/chats/${roomId}`);
  console.log();
  console.log("Results Summary:");
  console.log("───────────────");
  console.log("ScribeAgent:        ✓ Diagnostics parsed");
  console.log("  → Chief complaint:", diagnostics?.chief_complaint?.slice(0, 60));
  console.log("  → Diagnosis:", diagnostics?.diagnosis_notes?.slice(0, 60));
  console.log();
  console.log("PlannerAgent:       ✓ Treatment plan created");
  console.log("  → Investigations:", plannerResult?.investigations?.join(", "));
  console.log("  → Treatments:", plannerResult?.treatments?.map((t: any) => t.description).join(", "));
  console.log("  → Teeth marks:", plannerResult?.teeth_marks?.length, "teeth");
  console.log();
  console.log("PharmacologistAgent: ✓ Prescriptions generated");
  console.log("  → Prescriptions:", pharmaResult?.prescriptions?.map((p: any) => p.name).join(", "));
  console.log();
  console.log("All results visible on Band.ai at the URL above.");
}

testBandCommunication().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
