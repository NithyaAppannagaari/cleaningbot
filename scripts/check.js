import fs from "fs";
import { WebClient } from "@slack/web-api";

const token = process.env.SLACK_BOT_TOKEN;

const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
const state = JSON.parse(fs.readFileSync("state.json", "utf8"));

async function main() {
  const client = new WebClient(token);

  const current = state.current;
  if (!current?.messageTs || !current?.user || !current?.channel) {
    console.log("No current assignment found. Exiting.");
    return;
  }

  // Fetch reactions on the original assignment message
  const reactionsRes = await client.reactions.get({
    channel: current.channel,
    timestamp: current.messageTs,
    full: true
  });

  const msg = reactionsRes.message;
  const reactions = msg.reactions || [];

  const done = reactions.find((r) => r.name === config.doneEmoji);
  const usersWhoReacted = done?.users || [];

  const isCompleted = usersWhoReacted.includes(current.user);

  if (isCompleted) {
    console.log("Completed ✅ by", current.user);
    return;
  }

  // Not completed: post reminder
  const reminder =
    `⏰ Reminder <@${current.user}>: please finish cleaning and react with ✅ ` +
    `to the assignment message when done.\n` +
    `(Link: https://slack.com/archives/${current.channel}/p${current.messageTs.replace(".", "")})`;

  await client.chat.postMessage({
    channel: current.channel,
    text: reminder
  });

  console.log("Reminder sent.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
