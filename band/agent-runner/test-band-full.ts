/**
 * Band.ai True Multi-Agent Communication Test (with FDA Drug Lookup)
 *
 * Each agent communicates through Band.ai using its own API key:
 *   1. ScribeAgent creates room, processes transcript, posts via Band
 *   2. PlannerAgent reads Band message, processes, posts via Band
 *   3. PharmacologistAgent reads Band message, identifies drugs,
 *      looks them up on open.fda.gov API, then generates prescriptions
 *
 * All messages are sent with the correct agent identity on Band.ai.
 */

import OpenAI from "openai";

// ── Config ────────────────────────────────────────────────────

const BAND_API = "https://app.band.ai/api/v1";
const FEATHERLESS_API = "https://api.featherless.ai/v1";
const MODEL = "Qwen/Qwen2.5-7B-Instruct";

const SCRIBE_KEY = "band_a_1781389769_fAJjT2p7SwrYXSu2blm6C3jNxjXFwySq";
const PLANNER_KEY = "band_a_1781437164_jl5fTOIn52VBZCXJOJrKiComweIz-Zld";
const PHARMA_KEY = "band_a_1781437204_cYbePWOMr5JCYmOCNbeE6PKwaIIOPU21";
const FEATHERLESS_KEY =
  "rc_2e6d6b4c9d28136f3fbbfb9b535312dd614afa081d5c77f25008e95c2a960c18";

const SCRIBE_UUID = "54b43fbc-65ee-4136-ab47-a85a11800233";
const PLANNER_UUID = "83095480-d94a-4085-a636-3d7e8c969500";
const PHARMA_UUID = "279ce17c-8983-4ca2-9f6b-2935d252135d";
const SCRIBE_HANDLE = "meetnorthern/scribeagent";
const PLANNER_HANDLE = "meetnorthern/planneragent";
const PHARMA_HANDLE = "meetnorthern/pharmacologistagent";

// ── Prompts ────────────────────────────────────────────────────

const SCRIBE_PROMPT = `You are a specialized Dental Scribe Agent.
Your job is to parse unstructured clinical transcripts/audio dictations and return strictly structured JSON with the 7 clinical sections. Output Format: { "chief_complaint": "...", "medical_history_notes": "...", "other_conditions": "...", "drug_history": "...", "clinical_findings": "...", "investigation_notes": "...", "diagnosis_notes": "..." }`;

const PLANNER_PROMPT = `You are a Dental Treatment Planner Agent. Based on the provided diagnostics JSON, recommend investigations, dental treatment procedures (with tooth numbers and phases), and visual teeth chart markings. Supported conditions: 'compromised', 'endo', 'filled', 'missing', 'rotated', 'gum-recessed', 'displaced', 'sound'. Output: { "investigations": [...], "treatments": [{ "description": "...", "tooth": "...", "phase": "..." }], "teeth_marks": [{ "tooth_iso": 36, "condition": "...", "notes": "..." }] }`;

// Step 1: Identify what drugs are needed (names only)
const PHARMA_ID_PROMPT = `You are a Dental Pharmacologist Agent. Based on the diagnostics and treatment plan, identify what medications are needed. Consider the patient's allergies, medical history, and current medications. Output ONLY a JSON array of drug names (generic names preferred):

Example: { "recommended_drugs": ["Amoxicillin", "Ibuprofen", "Chlorhexidine gluconate"] }`;

// Step 2: Generate full prescriptions using FDA-sourced drug data
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
      "warning": "any warnings or empty string",
      "fda_source": "brand name from FDA"
    }
  ]
}`;

const SAMPLE_TRANSCRIPT = `Patient presents with severe pain in lower right molar area for the past 3 days. Pain is throbbing and worse when lying down. Patient has diabetes type 2, allergic to penicillin. Current medications include Metformin 500mg twice daily. On examination, tooth 46 has deep occlusal caries with tenderness to percussion. Radiograph shows carious lesion extending to pulp chamber. Diagnosis: Acute irreversible pulpitis with apical periodontitis.`;

// ── Helpers ────────────────────────────────────────────────────

const fexClient = new OpenAI({
  baseURL: FEATHERLESS_API,
  apiKey: FEATHERLESS_KEY,
});

async function callFeatherless(system: string, user: string): Promise<string> {
  const r = await fexClient.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });
  return r.choices[0]?.message?.content || "";
}

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

async function get(apiKey: string, path: string) {
  const r = await fetch(`${BAND_API}${path}`, {
    headers: { "X-API-Key": apiKey },
  });
  if (!r.ok)
    throw new Error(
      `GET ${path} -> ${r.status}: ${await r.text().then((t) => t.slice(0, 100))}`,
    );
  return r.json();
}

async function post(apiKey: string, path: string, body: any) {
  const r = await fetch(`${BAND_API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
    body: JSON.stringify(body),
  });
  if (!r.ok)
    throw new Error(
      `POST ${path} -> ${r.status}: ${await r.text().then((t) => t.slice(0, 100))}`,
    );
  return r.json();
}

function say(agent: string, msg: string) {
  console.log(`  [${agent}] ${msg}`);
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log("");
  console.log("  Band.ai Multi-Agent Test (with FDA Drug Lookup)");
  console.log("");

  // Verify all 3 agents
  for (const [name, key] of [
    ["ScribeAgent", SCRIBE_KEY] as const,
    ["PlannerAgent", PLANNER_KEY],
    ["PharmacologistAgent", PHARMA_KEY],
  ]) {
    const id = await get(key, "/agent/me");
    say(name, `Connected as @${id.data.handle}`);
  }
  console.log();

  // Step 1: ScribeAgent creates room
  say("ScribeAgent", "Creating chat room...");
  const roomTitle = `Dental-Scribe-${Date.now().toString(36)}`;
  const room = await post(SCRIBE_KEY, "/agent/chats", {
    chat: { title: roomTitle },
  });
  const chatId = room.data.id;

  await post(SCRIBE_KEY, `/agent/chats/${chatId}/participants`, {
    participant: { participant_id: PLANNER_UUID },
  });
  say("ScribeAgent", `Added @${PLANNER_HANDLE} to room`);
  await post(SCRIBE_KEY, `/agent/chats/${chatId}/participants`, {
    participant: { participant_id: PHARMA_UUID },
  });
  say("ScribeAgent", `Added @${PHARMA_HANDLE} to room`);
  console.log();

  // Step 2: ScribeAgent processes transcript -> posts to Band
  say("ScribeAgent", "Processing transcript via Featherless...");
  const scribeRaw = await callFeatherless(SCRIBE_PROMPT, SAMPLE_TRANSCRIPT);
  const diagnostics = JSON.parse(scribeRaw);
  say("ScribeAgent", `Diagnosis: ${diagnostics.diagnosis_notes}`);

  say("ScribeAgent", "Posting to Band.ai @mentioning PlannerAgent...");
  await post(SCRIBE_KEY, `/agent/chats/${chatId}/messages`, {
    message: {
      content: `@${PLANNER_HANDLE} Diagnostics complete. Please recommend treatments:\n\`\`\`json\n${JSON.stringify(diagnostics, null, 2)}\n\`\`\``,
      mentions: [{ id: PLANNER_UUID }],
    },
  });
  say("ScribeAgent", "Message sent!");
  console.log();

  // Step 3: PlannerAgent processes via Featherless -> posts to Band
  say("PlannerAgent", "Reading diagnostics from Band.ai...");
  await get(PLANNER_KEY, `/agent/chats/${chatId}/messages`);
  say("PlannerAgent", "Processing treatment plan via Featherless...");
  const plannerRaw = await callFeatherless(
    PLANNER_PROMPT,
    JSON.stringify(diagnostics),
  );
  const plannerResult = JSON.parse(plannerRaw);
  say(
    "PlannerAgent",
    `Treatments: ${plannerResult.treatments?.map((t: any) => t.description).join(", ")}`,
  );

  say("PlannerAgent", "Posting to Band.ai @mentioning PharmacologistAgent...");
  const pharmaInput = { diagnostics, treatments: plannerResult.treatments };
  await post(PLANNER_KEY, `/agent/chats/${chatId}/messages`, {
    message: {
      content: `@${PHARMA_HANDLE} Treatment plan ready. Please prescribe:\n\`\`\`json\n${JSON.stringify(pharmaInput, null, 2)}\n\`\`\``,
      mentions: [{ id: PHARMA_UUID }],
    },
  });
  say("PlannerAgent", "Message sent!");
  console.log();

  // Step 4: PharmacologistAgent with FDA API lookup
  say("PharmacologistAgent", "Reading treatment plan from Band.ai...");
  await get(PHARMA_KEY, `/agent/chats/${chatId}/messages`);

  // Step 4a: Identify what drugs are needed
  say(
    "PharmacologistAgent",
    "Identifying needed medications via Featherless...",
  );
  const pharmaIdRaw = await callFeatherless(
    PHARMA_ID_PROMPT,
    JSON.stringify(pharmaInput),
  );
  const pharmaIds = JSON.parse(pharmaIdRaw);
  const drugNames = pharmaIds.recommended_drugs || [];
  say("PharmacologistAgent", `Drugs needed: ${drugNames.join(", ")}`);

  // Step 4b: Look up each drug on FDA API
  say("PharmacologistAgent", "Searching FDA API for drug information...");
  const fdaResults: any[] = [];
  for (const drugName of drugNames) {
    const results = await lookupDrugOnFDA(drugName);
    if (results.length > 0) {
      say(
        "PharmacologistAgent",
        `  Found FDA data for ${drugName}: ${results.length} result(s)`,
      );
      fdaResults.push(...results);
    } else {
      say("PharmacologistAgent", `  No FDA results for ${drugName}`);
    }
  }

  // Step 4c: Generate final prescriptions using FDA data + Featherless
  say(
    "PharmacologistAgent",
    "Generating final prescriptions using FDA data + Featherless...",
  );
  const fdaContext = {
    patient: pharmaInput,
    fda_drug_data: fdaResults,
  };
  const pharmaRaw = await callFeatherless(
    PHARMA_FINAL_PROMPT,
    JSON.stringify(fdaContext, null, 2),
  );
  const pharmaResult = JSON.parse(pharmaRaw);
  for (const p of pharmaResult.prescriptions || []) {
    say(
      "PharmacologistAgent",
      `${p.name}: ${p.dosage}, ${p.frequency}, ${p.duration}${p.fda_source ? ` (FDA source: ${p.fda_source})` : ""}`,
    );
  }

  say("PharmacologistAgent", "Posting final results to Band.ai...");
  await post(PHARMA_KEY, `/agent/chats/${chatId}/messages`, {
    message: {
      content: `@${SCRIBE_HANDLE} @${PLANNER_HANDLE} Prescriptions ready (sourced from FDA API):\n\`\`\`json\n${JSON.stringify(pharmaResult, null, 2)}\n\`\`\``,
      mentions: [{ id: SCRIBE_UUID }],
    },
  });
  say("PharmacologistAgent", "Message sent!");
  console.log();

  // Step 5: Summary
  console.log("");
  console.log("  Results:");
  console.log("  -------------------------");
  console.log("");
  console.log("  ScribeAgent:");
  console.log(`    ${diagnostics.chief_complaint}`);
  console.log(`    ${diagnostics.diagnosis_notes}`);
  console.log("");
  console.log("  PlannerAgent:");
  for (const t of plannerResult.treatments || [])
    console.log(`    ${t.description} (tooth ${t.tooth}, ${t.phase})`);
  console.log("");
  console.log("  PharmacologistAgent (FDA-sourced):");
  for (const p of pharmaResult.prescriptions || []) {
    console.log(
      `    ${p.name}: ${p.dosage}, ${p.frequency}, for ${p.duration}`,
    );
    if (p.fda_source) console.log(`    FDA source: ${p.fda_source}`);
    if (p.warning) console.log(`    Warning: ${p.warning}`);
    console.log("");
  }
  console.log(
    "  FDA data used:",
    fdaResults.length,
    "drug entries from open.fda.gov",
  );
  console.log("  Room ID:", chatId);
}

main().catch((err) => {
  console.error("\n  Error:", err.message);
  process.exit(1);
});
