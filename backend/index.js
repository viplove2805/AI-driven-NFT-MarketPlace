require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { setupDb } = require("./db");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

let db;

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// AI Generation route with Intelligent Metadata Extraction Agent
app.post("/api/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  console.log(`Agent received prompt: ${prompt}`);

  // Phase 1: Intelligent Metadata Extraction
  // Simulating an LLM extracting entities from natural language
  let extractedName = "Astra Art #" + Math.floor(Math.random() * 1000);
  let extractedPrice = "100";

  // Regex to find "name [Value]" or "named [Value]"
  const nameMatch = prompt.match(/(?:name|named)\s+([a-zA-Z0-9_]+)/i);
  if (nameMatch) extractedName = nameMatch[1];

  // Regex to find "price [Number]" or "[Number] uastra"
  const priceMatch = prompt.match(/(?:price|cost)\s+(\d+)/i);
  if (priceMatch) extractedPrice = priceMatch[1];

  // Phase 2: AI Agent Prompt Enhancement
  const enhancedPrompt = `A hyper-realistic, cinematic masterpiece of ${prompt}, trending on ArtStation, 8k resolution, detailed textures, ethereal lighting, volumetric fog, masterpiece composition.`;

  console.log(
    `Agent extracted: Name=${extractedName}, Price=${extractedPrice}`
  );

  // Phase 3: Image Generation
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const mockImages = [
    "/assets/generated/cyberpunk_warrior.png",
    "/assets/generated/ethereal_landscape.png",
    "/assets/generated/cosmic_entity.png",
    "/assets/generated/neural_network.png",
  ];

  const imageUrl = mockImages[Math.floor(Math.random() * mockImages.length)];

  res.json({
    imageUrl,
    enhancedPrompt,
    extractedName,
    extractedPrice,
    agentName: "Astra-Neural-v1",
  });
});

// Metadata route
app.post("/api/metadata", async (req, res) => {
  const { name, description, ai_prompt, model_version, image_url } = req.body;

  if (!name || !ai_prompt) {
    return res.status(400).json({ error: "Name and AI Prompt are required" });
  }

  const metadata = {
    name,
    description,
    image: image_url || "https://placeholder.com/art.png",
    attributes: [
      { trait_type: "AI Prompt", value: ai_prompt },
      { trait_type: "Model Version", value: model_version || "v1.0" },
      { trait_type: "Platform", value: "AstraNode Art" },
    ],
    compiler: "AstraNode AI Engine",
  };

  // In a real app, we would upload this to IPFS here.
  // For MVP, we just return the JSON.
  res.json(metadata);
});

// Marketplace routes
app.get("/api/marketplace", async (req, res) => {
  try {
    const listings = await db.all(
      "SELECT * FROM listings ORDER BY created_at DESC"
    );
    res.json(listings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const { verifyEVMSignature } = require("./verify");

// ... (previous routes)

app.post("/api/marketplace/sync", async (req, res) => {
  const {
    nft_id,
    owner,
    price,
    denom,
    metadata_uri,
    image_url,
    name,
    description,
    ai_prompt,
    model_version,
    signature, // { pub_key, signature }
    message, // The message that was signed
    isDemo, // Whether this is a demo mint
  } = req.body;

  // Security Check: Verify the signature to prove ownership of the address
  if (!signature || !message) {
    return res
      .status(401)
      .json({
        error: "Authentication required: Signature and message missing",
      });
  }

  const isValid = isDemo
    ? true
    : await verifyEVMSignature(owner, message, signature);
  if (!isValid) {
    return res
      .status(403)
      .json({ error: "Security Check Failed: Invalid signature" });
  }

  try {
    await db.run(
      `INSERT OR REPLACE INTO listings (nft_id, owner, price, denom, metadata_uri, image_url, name, description, ai_prompt, model_version) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nft_id,
        owner,
        price,
        denom,
        metadata_uri,
        image_url,
        name,
        description,
        ai_prompt,
        model_version,
      ]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Listing (Price or Delist)
app.post("/api/marketplace/update", async (req, res) => {
  const { nft_id, owner, price, signature, message, action, isDemo } = req.body;

  if (!signature || !message) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const isValid = isDemo
    ? true
    : await verifyEVMSignature(owner, message, signature);
  if (!isValid) {
    return res
      .status(403)
      .json({ error: "Security Check Failed: Invalid signature" });
  }

  try {
    if (action === "update_price") {
      await db.run(
        "UPDATE listings SET price = ? WHERE nft_id = ? AND owner = ?",
        [price, nft_id, owner]
      );
    } else if (action === "delist") {
      await db.run("DELETE FROM listings WHERE nft_id = ? AND owner = ?", [
        nft_id,
        owner,
      ]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function start() {
  db = await setupDb();

  // Seed some data if empty
  const count = await db.get("SELECT COUNT(*) as count FROM listings");
  if (count.count === 0) {
    await db.run(`
            INSERT INTO listings (nft_id, owner, price, denom, metadata_uri, image_url, name, description, ai_prompt, model_version)
            VALUES 
            ('1', 'astra1...', '100', 'uastra', 'ipfs://...', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe', 'Neon Nebula', 'AI generated space art', 'A vibrant nebula with neon colors', 'v2.1'),
            ('2', 'astra2...', '250', 'uastra', 'ipfs://...', 'https://images.unsplash.com/photo-1633167606207-d840b5070fc2', 'Cyber Samurai', 'Futuristic warrior', 'A samurai in a cyberpunk city', 'v2.1'),
            ('3', 'astra3...', '50', 'uastra', 'ipfs://...', 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e', 'Digital Dream', 'Abstract digital art', 'A dreamlike abstract landscape', 'v1.5')
        `);
  }

  app.listen(PORT, () => {
    console.log(`AstraNode Backend running on http://localhost:${PORT}`);
  });
}

start();
