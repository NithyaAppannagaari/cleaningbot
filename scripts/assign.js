import fs from "fs";
import { WebClient } from "@slack/web-api";

const token = process.env.SLACK_BOT_TOKEN;
const channel = process.env.MAIN_CHANNEL_ID;

const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
const statePath = "state.json";

function loadState() {
  if (!fs.existsSync(statePath)) return {};
  return JSON.parse(fs.readFileSync(statePath, "utf8"));
}
function saveState(state) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function pickMember(members, lastAssigned) {
  // avoid immediate repeat if possible
  const choices = members.filter((m) => m !== lastAssigned);
  const pool = choices.length ? choices : members;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function main() {
  const client = new WebClient(token);

  const state = loadState();
  const lastAssigned = state.current?.user;

  const user = pickMember(config.members, lastAssigned);

  const text =
    `🧹 <@${user}> is on cleaning duty this week!\n` +
    `When you're done, react to *this message* with ✅ (:${config.doneEmoji}:).`;

  const res = await client.chat.postMessage({ channel, text });

  // Save message ts + assigned user
  state.current = {
    user,
    channel,
    messageTs: res.ts,
    assignedAt: new Date().toISOString()
  };

  saveState(state);

  console.log("Assigned:", user, "messageTs:", res.ts);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
