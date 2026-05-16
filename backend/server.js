require("dotenv").config();
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "glazing_clip_secret_key_2024";

const MONGO_URL = process.env.MONGO_URL;

let db;

// Connect MongoDB
MongoClient.connect(MONGO_URL)
  .then((client) => {
    db = client.db("glassing_optimizer");
    console.log("MongoDB Connected ✅");
  })
  .catch((err) => console.error("Mongo Error:", err));

// ==========================
// Auth Middleware
// ==========================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  next();
}

// ==========================
// Auth Routes
// ==========================

// Register
app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    const existing = await db.collection("users").findOne({ email });
    if (existing)
      return res.status(409).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // First user becomes admin
    const userCount = await db.collection("users").countDocuments();
    const role = userCount === 0 ? "admin" : "user";

    const result = await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
    });

    const token = jwt.sign(
      { userId: result.insertedId.toString(), name, email, role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { id: result.insertedId, name, email, role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

// Login
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const user = await db.collection("users").findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id.toString(), name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

// Get current user
app.get("/auth/me", authMiddleware, async (req, res) => {
  try {
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(req.user.userId) }, { projection: { password: 0 } });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

// ==========================
// Combination Based Optimizer
// ==========================
function bestCombination(stock, arr) {
  const n = arr.length;

  // dp[s] = true if sum s is achievable
  const dp = new Array(stock + 1).fill(false);
  dp[0] = true;

  // parent[s] = index of item added to reach sum s
  const parent = new Array(stock + 1).fill(-1);

  // chosen[s] = which dp-sum we came from
  const prev = new Array(stock + 1).fill(-1);

  for (let i = 0; i < n; i++) {
    const val = arr[i];
    // traverse backwards to avoid reusing same index
    for (let s = stock; s >= val; s--) {
      if (dp[s - val] && !dp[s]) {
        dp[s] = true;
        parent[s] = i;   // item index used
        prev[s] = s - val; // previous sum
      }
    }
  }

  // Find the largest achievable sum ≤ stock
  let bestSum = 0;
  for (let s = stock; s >= 0; s--) {
    if (dp[s]) { bestSum = s; break; }
  }

  // Backtrack to find which items form bestSum
  const bestCombo = [];
  const used = new Array(n).fill(false);
  let cur = bestSum;

  while (cur > 0 && parent[cur] !== -1) {
    const idx = parent[cur];
    bestCombo.push(arr[idx]);
    cur = prev[cur];
  }

  return bestCombo;
}

// ==========================
// OPTIMIZE ROUTE (Protected)
// ==========================
app.post("/optimize", authMiddleware, async (req, res) => {
  try {
    const { siteName, stockLength, inputData } = req.body;

    if (!siteName || !stockLength || !inputData?.length)
      return res.status(400).json({ error: "Invalid input" });

    const stockInches = stockLength * 12;
    let pieces = [];

    inputData.forEach((item) => {
      for (let i = 0; i < Number(item.quantity); i++) {
        pieces.push(Number(item.length) * 12);
      }
    });

    pieces.sort((a, b) => b - a);
    let rods = [];

    while (pieces.length > 0) {
      const combo = bestCombination(stockInches, pieces);
      if (combo.length === 0) break;
      rods.push(combo);
      combo.forEach((piece) => {
        const index = pieces.indexOf(piece);
        if (index > -1) pieces.splice(index, 1);
      });
    }

    let totalWaste = 0;
    const detailedRods = rods.map((rod, index) => {
      const used = rod.reduce((a, b) => a + b, 0);
      const waste = stockInches - used;
      totalWaste += waste;
      return {
        rodNumber: index + 1,
        pieces: rod.map((p) => (p / 12).toFixed(2)),
        waste: (waste / 12).toFixed(2),
      };
    });

    const wastePercentage = (
      (totalWaste / (rods.length * stockInches)) * 100
    ).toFixed(2);

    const insertResult = await db.collection("projects").insertOne({
      siteName,
      stockLength,
      totalRods: rods.length,
      totalWaste: (totalWaste / 12).toFixed(2),
      wastePercentage,
      rods: detailedRods,
      userId: req.user.userId,
      userName: req.user.name,
      createdAt: new Date(),
    });

    res.json({
      _id: insertResult.insertedId,
      totalRods: rods.length,
      totalWaste: (totalWaste / 12).toFixed(2),
      wastePercentage,
      rods: detailedRods,
      siteName,
      stockLength,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

// ==========================
// GET PROJECTS (User's own)
// ==========================
app.get("/projects", authMiddleware, async (req, res) => {
  try {
    const projects = await db
      .collection("projects")
      .find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: "Fetch error" });
  }
});

// ==========================
// SEARCH PROJECTS by siteName
// ==========================
app.get("/projects/search", authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    const query = {
      userId: req.user.userId,
      siteName: { $regex: q || "", $options: "i" },
    };
    const projects = await db
      .collection("projects")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: "Search error" });
  }
});

// ==========================
// GET SINGLE PROJECT (for Blueprint)
// ==========================
app.get("/projects/:id", authMiddleware, async (req, res) => {
  try {
    const project = await db
      .collection("projects")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!project) return res.status(404).json({ error: "Not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

// ==========================
// ADMIN ROUTES
// ==========================

// Get all users
app.get("/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Fetch error" });
  }
});

// Get all projects
app.get("/admin/projects", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const projects = await db
      .collection("projects")
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: "Fetch error" });
  }
});

// Delete any project
app.delete("/admin/projects/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.collection("projects").deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Delete error" });
  }
});

// Update user role
app.patch("/admin/users/:id/role", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["admin", "user"].includes(role))
      return res.status(400).json({ error: "Invalid role" });
    await db
      .collection("users")
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: { role } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Update error" });
  }
});

// Admin stats
app.get("/admin/stats", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [userCount, projectCount, projects] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("projects").countDocuments(),
      db.collection("projects").find().toArray(),
    ]);
    const totalWaste = projects
      .reduce((sum, p) => sum + Number(p.totalWaste || 0), 0)
      .toFixed(2);
    res.json({ userCount, projectCount, totalWaste });
  } catch (err) {
    res.status(500).json({ error: "Stats error" });
  }
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log("Server running at http://localhost:" + PORT);
  });
}

module.exports = app;