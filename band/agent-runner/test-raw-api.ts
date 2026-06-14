import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const BAND_API = "https://app.band.ai/api/v1";

const SCRIBE_KEY = process.env.BAND_SCRIBE_KEY?.replace(/^['"]|['"]$/g, "").trim() || "";
const PLANNER_KEY = process.env.BAND_PLANNER_KEY?.replace(/^['"]|['"]$/g, "").trim() || "";
const PHARMA_KEY = process.env.BAND_PHARMA_KEY?.replace(/^['"]|['"]$/g, "").trim() || "";

const SCRIBE_UUID = process.env.VITE_SCRIBE_UUID || "54b43fbc-65ee-4136-ab47-a85a11800233";
const PLANNER_UUID = process.env.VITE_PLANNER_UUID || "83095480-d94a-4085-a636-3d7e8c969500";
const PHARMA_UUID = process.env.VITE_PHARMACOLOGIST_UUID || "279ce17c-8983-4ca2-9f6b-2935d252135d";

console.log("Using keys:");
console.log("SCRIBE_KEY:", SCRIBE_KEY ? `${SCRIBE_KEY.substring(0, 15)}...` : "missing");
console.log("PLANNER_KEY:", PLANNER_KEY ? `${PLANNER_KEY.substring(0, 15)}...` : "missing");
console.log("PHARMA_KEY:", PHARMA_KEY ? `${PHARMA_KEY.substring(0, 15)}...` : "missing");
console.log("SCRIBE_UUID:", SCRIBE_UUID);
console.log("PLANNER_UUID:", PLANNER_UUID);
console.log("PHARMA_UUID:", PHARMA_UUID);

async function test() {
  if (!SCRIBE_KEY) {
    console.error("No SCRIBE_KEY configured.");
    return;
  }

  const roomName = `Api-Test-${Date.now().toString(36)}`;
  console.log(`\n1. Creating room: "${roomName}" using SCRIBE_KEY...`);
  
  const createRes = await fetch(`${BAND_API}/agent/chats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": SCRIBE_KEY,
    },
    body: JSON.stringify({ chat: { title: roomName } }),
  });
  
  console.log("Create room response status:", createRes.status);
  const roomData: any = await createRes.json();
  console.log("Create room response body:", JSON.stringify(roomData, null, 2));

  const roomId = roomData.data?.id || roomData.id;
  if (!roomId) {
    console.error("Room creation failed, no roomId returned.");
    return;
  }

  // Adding participants
  const agentsToAdd = [
    { role: "ScribeAgent", uuid: SCRIBE_UUID },
    { role: "PlannerAgent", uuid: PLANNER_UUID },
    { role: "PharmacologistAgent", uuid: PHARMA_UUID },
  ];

  console.log("\n2. Adding participants using SCRIBE_KEY...");
  for (const agent of agentsToAdd) {
    console.log(`Adding ${agent.role} (${agent.uuid})...`);
    const addRes = await fetch(`${BAND_API}/agent/chats/${roomId}/participants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": SCRIBE_KEY,
      },
      body: JSON.stringify({
        participant: { participant_id: agent.uuid }
      }),
    });
    console.log(`Add ${agent.role} response status:`, addRes.status);
    console.log(`Add ${agent.role} body:`, await addRes.text());
  }

  // Post trigger message
  console.log("\n3. Posting initial trigger message using PLANNER_KEY...");
  const postRes = await fetch(`${BAND_API}/agent/chats/${roomId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": PLANNER_KEY,
    },
    body: JSON.stringify({
      message: {
        content: `@meetnorthern/scribeagent process this clinical input: Test message`,
        mentions: [{ id: SCRIBE_UUID }]
      }
    }),
  });

  console.log("Post message response status:", postRes.status);
  console.log("Post message body:", await postRes.text());
}

test().catch(console.error);
