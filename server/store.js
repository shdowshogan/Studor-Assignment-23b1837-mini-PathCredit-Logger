import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "db.json");

const baseState = {
  users: [],
  activities: []
};

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify(baseState, null, 2));
  }
}

export async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(dataFile, "utf-8");
  return JSON.parse(raw);
}

export async function writeStore(nextState) {
  await ensureStore();
  await fs.writeFile(dataFile, JSON.stringify(nextState, null, 2));
}
