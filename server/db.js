import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";
import { PGlite } from "@electric-sql/pglite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env") });

const DATABASE_URL = process.env.DATABASE_URL || "pglite://./data/facetroop";
const isPostgres = DATABASE_URL.startsWith("postgres://") || DATABASE_URL.startsWith("postgresql://");

let pool = null;
let pglite = null;

function postgresSsl(connectionString) {
  const local = /localhost|127\.0\.0\.1|::1/i.test(connectionString);
  return local ? false : { rejectUnauthorized: false };
}

if (isPostgres) {
  pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: postgresSsl(DATABASE_URL),
  });
} else {
  const dataDir = DATABASE_URL.replace(/^pglite:\/\//, "") || "./data/facetroop";
  const absolute = path.resolve(root, dataDir);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  pglite = new PGlite(absolute);
}

export async function query(text, params = []) {
  if (pool) return pool.query(text, params);
  return pglite.query(text, params);
}

export async function withTransaction(work) {
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  return pglite.transaction(async (tx) => work(tx));
}

export async function initDatabase() {
  const schema = fs.readFileSync(path.join(root, "server", "schema.sql"), "utf8");
  const statements = schema
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  if (pglite) {
    await pglite.exec(schema);
  } else {
    for (const statement of statements) {
      await query(`${statement};`);
    }
  }
  await seedIfEmpty();
  await seedAdmin();
}

async function seedIfEmpty() {
  const { rows } = await query("SELECT COUNT(*)::int AS count FROM talent");
  if (rows[0].count > 0) return;

  const talent = [
    ["tal_aanya", "Aanya Rao", "Actor · Creator", "https://images.unsplash.com/photo-1535579710123-3c0f261c474e?auto=format&fit=crop&w=900&q=85", "824K", 46, ["Female", "Actor", "Creator"], 26, "₹42,000", 42000, 2418, 34],
    ["tal_arjun", "Arjun Mehta", "Actor · Model", "https://images.unsplash.com/photo-1590335745924-8430837a573d?auto=format&fit=crop&w=900&q=85", "356K", 31, ["Male", "Actor", "Model"], 29, "₹36,000", 36000, 1104, 18],
    ["tal_mira", "Mira Sen", "Artist · Musician", "https://images.unsplash.com/photo-1563170446-9c3c0622d8a9?auto=format&fit=crop&w=900&q=85", "1.2M", 68, ["Female", "Artist"], 32, "₹58,000", 58000, 3901, 52],
    ["tal_kabir", "Kabir Anand", "Creator · Performer", "https://images.unsplash.com/photo-1641108001784-cdf7d87b353f?auto=format&fit=crop&w=900&q=85", "219K", 24, ["Male", "Creator"], 24, "₹28,000", 28000, 812, 11],
    ["tal_tara", "Tara Kapoor", "Model · Actor", "https://images.unsplash.com/photo-1520529277867-dbf8c5e0b340?auto=format&fit=crop&w=900&q=85", "617K", 39, ["Female", "Model", "Actor"], 27, "₹39,000", 39000, 1760, 27],
    ["tal_dev", "Dev Malhotra", "Actor · Voice artist", "https://images.unsplash.com/flagged/photo-1571367034861-e6729ad9c2d5?auto=format&fit=crop&w=900&q=85", "403K", 35, ["Male", "Actor", "Artist"], 41, "₹44,000", 44000, 1544, 22],
  ];

  for (const row of talent) {
    await query(
      `INSERT INTO talent (id, name, type, image, followers, collaborations, tags, age, price, proposed_price, views, shortlists, verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, FALSE)
       ON CONFLICT (id) DO NOTHING`,
      row,
    );
  }

  await query(
    `INSERT INTO media (owner_id, title, image) VALUES
      ('tal_aanya', 'Front profile', 'https://images.unsplash.com/photo-1535579710123-3c0f261c474e?auto=format&fit=crop&w=900&q=85'),
      ('tal_aanya', 'Side profile', 'https://images.unsplash.com/photo-1517462964-21fdcec3f25b?auto=format&fit=crop&w=900&q=85'),
      ('tal_aanya', 'Joy · expression', 'https://images.unsplash.com/photo-1520529277867-dbf8c5e0b340?auto=format&fit=crop&w=900&q=85')`,
  );
}

async function seedAdmin() {
  await query(
    `INSERT INTO users (id, role, name, phone, email, company, gstin, email_verified, identity_verified)
     VALUES ('usr_admin_rsogani', 'admin', 'R Sogani', '', 'rsogani2008@gmail.com', 'FACETROOP', '', TRUE, TRUE)
     ON CONFLICT (email) DO UPDATE SET role = 'admin', name = EXCLUDED.name, email_verified = TRUE, identity_verified = TRUE`,
  );
}

export { pool };
