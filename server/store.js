import { query, withTransaction } from "./db.js";

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1535579710123-3c0f261c474e?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1590335745924-8430837a573d?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1563170446-9c3c0622d8a9?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1641108001784-cdf7d87b353f?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1520529277867-dbf8c5e0b340?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/flagged/photo-1571367034861-e6729ad9c2d5?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1517462964-21fdcec3f25b?auto=format&fit=crop&w=900&q=85",
];

function id(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    emailVerified: row.email_verified,
    identityVerified: row.identity_verified,
    age: row.age,
    ethnicity: row.ethnicity,
    city: row.city,
    title: row.title,
    bio: row.bio,
    talentId: row.talent_id,
  };
}

function publicTalent(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    image: row.image,
    followers: row.followers,
    collaborations: row.collaborations,
    tags: row.tags,
    age: row.age,
    price: row.price,
    views: row.views,
    shortlists: row.shortlists,
  };
}

function ageSql(ranges) {
  if (!ranges.length) return { sql: "TRUE", params: [] };
  const clauses = [];
  const params = [];
  for (const range of ranges) {
    if (range === "18-25" || range === "18–25") {
      clauses.push("(age BETWEEN 18 AND 25)");
    } else if (range === "26-35" || range === "26–35") {
      clauses.push("(age BETWEEN 26 AND 35)");
    } else if (range === "36-50" || range === "36–50") {
      clauses.push("(age BETWEEN 36 AND 50)");
    } else {
      clauses.push("(age >= 50)");
    }
  }
  return { sql: `(${clauses.join(" OR ")})`, params };
}

export async function listTalent({ query: q = "", gender = "All", categories = [], ages = [] } = {}) {
  const needle = String(q).trim();
  const age = ageSql(ages);
  const params = [needle, gender, categories];
  const { rows } = await query(
    `SELECT * FROM talent
     WHERE (
       $1 = ''
       OR name ILIKE '%' || $1 || '%'
       OR type ILIKE '%' || $1 || '%'
       OR EXISTS (SELECT 1 FROM unnest(tags) AS tag WHERE tag ILIKE '%' || $1 || '%')
     )
     AND ($2 = 'All' OR $2 = ANY(tags))
     AND (cardinality($3::text[]) = 0 OR tags && $3::text[])
     AND ${age.sql}
     ORDER BY created_at DESC`,
    params,
  );
  return rows.map(publicTalent);
}

export async function registerUser(input) {
  const name = String(input.name || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  if (!name || !email) {
    throw Object.assign(new Error("Name and email are required"), { status: 400 });
  }

  try {
    const { rows } = await query(
      `INSERT INTO users (id, role, name, phone, email, company, gstin, email_verified, identity_verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        id("usr"),
        input.role === "buyer" ? "buyer" : "artist",
        name,
        String(input.phone || "").trim(),
        email,
        String(input.company || "").trim(),
        String(input.gstin || "").trim(),
        Boolean(input.emailVerified),
        Boolean(input.identityVerified),
      ],
    );
    return publicUser(rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      throw Object.assign(new Error("An account with this email already exists"), { status: 409 });
    }
    throw error;
  }
}

export async function getUser(userId) {
  const { rows } = await query("SELECT * FROM users WHERE id = $1", [userId]);
  if (!rows[0]) throw Object.assign(new Error("User not found"), { status: 404 });
  return publicUser(rows[0]);
}

export async function verifyUser(userId, field) {
  const sql =
    field === "email"
      ? "UPDATE users SET email_verified = TRUE WHERE id = $1 RETURNING *"
      : "UPDATE users SET identity_verified = TRUE WHERE id = $1 RETURNING *";
  const { rows } = await query(sql, [userId]);
  if (!rows[0]) throw Object.assign(new Error("User not found"), { status: 404 });
  return publicUser(rows[0]);
}

export async function completeProfile(userId, input) {
  return withTransaction(async (db) => {
    const existing = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
    if (!existing.rows[0]) throw Object.assign(new Error("User not found"), { status: 404 });
    const user = existing.rows[0];
    let talentId = user.talent_id;
    const age = Number(input.age) || null;
    const title = String(input.title || "");

    if (user.role === "artist" && !talentId) {
      talentId = id("tal");
      await db.query(
        `INSERT INTO talent (id, user_id, name, type, image, followers, collaborations, tags, age, price, views, shortlists)
         VALUES ($1,$2,$3,$4,$5,'0',0, ARRAY['Creator']::text[], $6, '₹28,000', 0, 0)`,
        [talentId, userId, user.name, title || "Creator", SAMPLE_IMAGES[0], age || 18],
      );
    }

    const updated = await db.query(
      `UPDATE users
       SET age = $2, ethnicity = $3, city = $4, title = $5, bio = $6, talent_id = $7
       WHERE id = $1
       RETURNING *`,
      [userId, age, String(input.ethnicity || ""), String(input.city || ""), title, String(input.bio || ""), talentId],
    );
    return publicUser(updated.rows[0]);
  });
}

export async function getStudio(userId) {
  const user = await getUser(userId);
  const ownerId = user.talentId || user.id;
  const uploads = await query("SELECT id, owner_id AS \"ownerId\", title, image FROM media WHERE owner_id = $1 OR owner_id = $2 ORDER BY id", [
    ownerId,
    user.id,
  ]);
  const card = user.talentId ? await query("SELECT * FROM talent WHERE id = $1", [user.talentId]) : { rows: [] };
  const related = user.talentId
    ? await query("SELECT COUNT(*)::int AS count, COALESCE(SUM(total),0)::int AS earnings FROM licenses WHERE talent_id = $1", [user.talentId])
    : { rows: [{ count: 0, earnings: 0 }] };
  const completion = Math.min(100, 40 + uploads.rows.length * 8 + (user.bio ? 12 : 0) + (user.identityVerified ? 12 : 0));

  return {
    user,
    uploads: uploads.rows,
    completion,
    stats: {
      views: card.rows[0]?.views ?? 0,
      shortlists: card.rows[0]?.shortlists ?? 0,
      licenses: related.rows[0].count,
      earnings: related.rows[0].earnings,
    },
  };
}

export async function addMedia(userId) {
  const user = await getUser(userId);
  const ownerId = user.talentId || user.id;
  const { rows: countRows } = await query("SELECT COUNT(*)::int AS count FROM media");
  const image = SAMPLE_IMAGES[countRows[0].count % SAMPLE_IMAGES.length];
  const { rows } = await query(
    `INSERT INTO media (owner_id, title, image) VALUES ($1, 'New expression', $2)
     RETURNING id, owner_id AS "ownerId", title, image`,
    [ownerId, image],
  );
  return rows[0];
}

export async function removeMedia(userId, mediaId) {
  const user = await getUser(userId);
  const ownerId = user.talentId || user.id;
  const { rows } = await query(
    `DELETE FROM media
     WHERE id = $1 AND (owner_id = $2 OR owner_id = $3)
     RETURNING id, owner_id AS "ownerId", title, image`,
    [mediaId, ownerId, user.id],
  );
  if (!rows[0]) throw Object.assign(new Error("Media not found"), { status: 404 });
  return rows[0];
}

export async function createLicense(input) {
  const { rows: talentRows } = await query("SELECT * FROM talent WHERE id = $1", [input.talentId]);
  const profile = talentRows[0];
  if (!profile) throw Object.assign(new Error("Talent not found"), { status: 404 });
  const licenseFee = Number(String(profile.price).replace(/[₹,]/g, ""));
  const protection = 4200;
  const { rows } = await query(
    `INSERT INTO licenses (id, talent_id, talent_name, buyer_id, usage, duration, description, license_fee, protection, total, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending_creator_approval')
     RETURNING *`,
    [
      id("lic"),
      profile.id,
      profile.name,
      input.buyerId || null,
      String(input.usage || "Film & streaming"),
      String(input.duration || "12 months"),
      String(input.description || ""),
      licenseFee,
      protection,
      licenseFee + protection,
    ],
  );
  const row = rows[0];
  return {
    id: row.id,
    talentId: row.talent_id,
    talentName: row.talent_name,
    buyerId: row.buyer_id,
    usage: row.usage,
    duration: row.duration,
    description: row.description,
    licenseFee: row.license_fee,
    protection: row.protection,
    total: row.total,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function listLicenses() {
  const { rows } = await query("SELECT * FROM licenses ORDER BY created_at DESC");
  return rows.map((row) => ({
    id: row.id,
    talentId: row.talent_id,
    talentName: row.talent_name,
    buyerId: row.buyer_id,
    usage: row.usage,
    duration: row.duration,
    description: row.description,
    licenseFee: row.license_fee,
    protection: row.protection,
    total: row.total,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export { SAMPLE_IMAGES };
