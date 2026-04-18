import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import { readStore, writeStore } from "./store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "studor-screening-secret";
const allowedCategories = ["Academic", "Technical", "Cultural", "Sports"];

app.use(cors());
app.use(express.json());

function buildToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: "1d" }
  );
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}

function authRequired(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required." });
  }

  const token = header.slice("Bearer ".length);

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Session expired or invalid." });
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/register", async (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password?.trim();

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const state = await readStore();
  const existingUser = state.users.find((user) => user.email === email);

  if (existingUser) {
    return res.status(409).json({ message: "An account with that email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  state.users.push(user);
  await writeStore(state);

  res.status(201).json({
    token: buildToken(user),
    user: sanitizeUser(user)
  });
});

app.post("/api/auth/login", async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password?.trim();

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const state = await readStore();
  const user = state.users.find((entry) => entry.email === email);

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  res.json({
    token: buildToken(user),
    user: sanitizeUser(user)
  });
});

app.get("/api/activities", authRequired, async (req, res) => {
  const state = await readStore();
  const category = req.query.category?.trim();

  let activities = state.activities
    .filter((activity) => activity.userId === req.user.sub)
    .sort((left, right) => new Date(right.date) - new Date(left.date));

  if (category && category !== "All") {
    activities = activities.filter((activity) => activity.category === category);
  }

  res.json({ activities });
});

app.post("/api/activities", authRequired, async (req, res) => {
  const name = req.body.name?.trim();
  const category = req.body.category?.trim();
  const date = req.body.date?.trim();

  if (!name || !category || !date) {
    return res.status(400).json({ message: "Name, category, and date are required." });
  }

  if (!allowedCategories.includes(category)) {
    return res.status(400).json({ message: "Invalid category selected." });
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: "Enter a valid date." });
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (parsedDate > today) {
    return res.status(400).json({ message: "Activity date cannot be in the future." });
  }

  const state = await readStore();
  const activity = {
    id: crypto.randomUUID(),
    userId: req.user.sub,
    name,
    category,
    date,
    createdAt: new Date().toISOString()
  };

  state.activities.push(activity);
  await writeStore(state);

  res.status(201).json({ activity });
});

app.delete("/api/activities/:activityId", authRequired, async (req, res) => {
  const { activityId } = req.params;
  const state = await readStore();
  const activityIndex = state.activities.findIndex(
    (activity) => activity.id === activityId && activity.userId === req.user.sub
  );

  if (activityIndex === -1) {
    return res.status(404).json({ message: "Activity not found." });
  }

  state.activities.splice(activityIndex, 1);
  await writeStore(state);

  res.status(204).send();
});

app.get("/api/me", authRequired, async (req, res) => {
  const state = await readStore();
  const user = state.users.find((entry) => entry.id === req.user.sub);

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  res.json({ user: sanitizeUser(user) });
});

app.use(express.static(distDir));

app.get("*", async (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }

  res.sendFile(path.join(distDir, "index.html"), (error) => {
    if (error) {
      res.status(404).json({ message: "Frontend build not found. Run npm run dev or npm run build." });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
