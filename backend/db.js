const sqlite3 = require("sqlite3").verbose()
const { open } = require("sqlite")
const path = require("path")

async function setupDb() {
  const db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database
  })

  await db.exec(`
        CREATE TABLE IF NOT EXISTS listings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nft_id TEXT UNIQUE,
            owner TEXT,
            price TEXT,
            denom TEXT,
            metadata_uri TEXT,
            image_url TEXT,
            name TEXT,
            description TEXT,
            ai_prompt TEXT,
            model_version TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `)

  return db
}

module.exports = { setupDb }
