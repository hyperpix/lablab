/**
 * Band.ai Direct Agent API Test
 *
 * Uses the band_a_ key directly with the Agent API endpoints.
 * The `band_a_` prefix means this is an Agent API key.
 */

import OpenAI from "openai";

const BAND_API = "https://app.band.ai/api/v1";
const FEATHERLESS_API = "https://api.featherless.ai/v1";
const MODEL = "Qwen/Qwen2.5-7B-Instruct";

const BAND_KEY = "band_a_1781389769_fAJjT2p7SwrYXSu2blm6C3jNxjXFwySq";
const FEATHERLESS_KEY = "rc_2e6d6b4c9d28136f3fbbfb9b535312dd614afa081d5c77f25008e95c2a960c18";

// Agent UUIDs from .env
const SCRIBE_UUID = "54b43fbc-65ee-4136-ab47-a85a11800233";
const PLANNER_UUID = "83095480-d94a-4085-a636-3d7e8c969500";
const PHARMA_UUID = "279ce17c-8983-4ca2-9f6b-2935d252135d";

async function bandGet(path: string) {
  const res = await fetch(`${BAND_API}${path}`, {
    headers: { "X-API-Key": BAND_KEY },
  });
  const text = await res.text();
  console.log(`  GET ${path} → ${res.status}`);
  try { return JSON.parse(text); } catch { return text; }
}

async function bandPost(path: string, body: any) {
  const res = await fetch(`${BAND_API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": BAND_KEY },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log(`  POST ${path} → ${res.status}`);
  try { return JSON.parse(text); } catch { return text; }
}

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  Band.ai Agent API Direct Test                  ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log();

  // ── Step 1: Check identity ──
  console.log("Step 1: Who am I? (GET /agent/me)");
  const identity = await bandGet("/agent/me");
  console.log(JSON.stringify(identity, null, 2));
  console.log();

  // ── Step 2: List contacts ──
  console.log("Step 2: List contacts (GET /agent/contacts)");
  const contacts = await bandGet("/agent/contacts");
  console.log(JSON.stringify(contacts, null, 2));
  console.log();

  // ── Step 3: List peers ──
  console.log("Step 3: List peers (GET /agent/peers)");
  const peers = await bandGet("/agent/peers");
  console.log(JSON.stringify(peers, null, 2));
  console.log();

  // ── Step 4: List existing chats ──
  console.log("Step 4: List chats (GET /agent/chats)");
  const chats = await bandGet("/agent/chats");
  console.log(JSON.stringify(chats, null, 2));
  console.log();

  // ── Step 5: Try to create a chat room ──
  console.log("Step 5: Create chat room (POST /agent/chats)");
  const createResult = await bandPost("/agent/chats", {
    chat: { title: `Dently-Test-${Date.now().toString(36)}` }
  });
  console.log(JSON.stringify(createResult, null, 2));
  console.log();
}

main().catch(err => console.error("Error:", err));
