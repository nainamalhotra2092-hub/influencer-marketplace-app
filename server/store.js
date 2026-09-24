import crypto from "node:crypto";
import { query, withTransaction } from "./db.js";
import { mailConfigured, sendLoginOtp } from "./mail.js";

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

function rupeesFromText(value) {
  return Number(String(value || "0").replace(/[₹,]/g, "")) || 0;
}

function rupeesLabel(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function publicTalent(row) {
  const proposed = row.proposed_price ?? rupeesFromText(row.price);
  const agreed = row.agreed_price ?? proposed;
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    image: row.image,
    followers: row.followers,
    collaborations: row.collaborations,
    tags: row.tags,
    age: row.age,
    price: rupeesLabel(agreed),
    proposedPrice: proposed,
    agreedPrice: agreed,
    processingFee: row.processing_fee ?? 0,
    verified: Boolean(row.verified),
    views: row.views,
    shortlists: row.shortlists,
  };
}

function ageSql(ranges) {
  if (!ranges.length) return { sql: "TRUE", params: [] };
  const clauses = [];
  const params = [];
  for (const range of ranges) {
    if (range === "Below 18" || range === "below 18" || range === "<18") {
      clauses.push("(age < 18)");
    } else if (range === "18-25" || range === "18–25") {
      clauses.push("(age BETWEEN 18 AND 25)");
    } else if (range === "26-35" || range === "26–35") {
      clauses.push("(age BETWEEN 26 AND 35)");
    } else if (range === "36-50" || range === "36–50") {
      clauses.push("(age BETWEEN 36 AND 50)");
    } else if (range === "50+" || range === "50") {
      clauses.push("(age >= 50)");
    }
  }
  if (!clauses.length) return { sql: "TRUE", params: [] };
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
     AND verified = TRUE
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

function hashOtp(email, code) {
  return crypto.createHash("sha256").update(`${email}:${code}`).digest("hex");
}

function hashesMatch(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function requestLoginOtp(emailInput) {
  const email = String(emailInput || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw Object.assign(new Error("Enter a valid email address"), { status: 400 });
  }

  const { rows } = await query("SELECT id FROM users WHERE email = $1", [email]);
  if (!rows[0]) {
    throw Object.assign(new Error("No account found for this email"), { status: 404 });
  }

  const recent = await query("SELECT created_at FROM login_otps WHERE email = $1", [email]);
  if (recent.rows[0]) {
    const ageMs = Date.now() - new Date(recent.rows[0].created_at).getTime();
    if (ageMs < 30_000) {
      throw Object.assign(new Error("Please wait a few seconds before requesting another code"), { status: 429 });
    }
  }

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await query(
    `INSERT INTO login_otps (email, code_hash, expires_at, attempts, created_at)
     VALUES ($1, $2, $3, 0, NOW())
     ON CONFLICT (email) DO UPDATE SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at, attempts = 0, created_at = NOW()`,
    [email, hashOtp(email, code), expiresAt.toISOString()],
  );

  const { delivered } = await sendLoginOtp(email, code);
  return {
    email,
    sent: true,
    delivered,
    ...(delivered || mailConfigured() ? {} : { devOtp: code }),
  };
}

export async function verifyLoginOtp(emailInput, codeInput) {
  const email = String(emailInput || "").trim().toLowerCase();
  const code = String(codeInput || "").trim();
  if (!email || !/^\d{6}$/.test(code)) {
    throw Object.assign(new Error("Enter the 6-digit code from your email"), { status: 400 });
  }

  const otp = await query("SELECT * FROM login_otps WHERE email = $1", [email]);
  const row = otp.rows[0];
  if (!row) {
    throw Object.assign(new Error("Request a new login code"), { status: 400 });
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await query("DELETE FROM login_otps WHERE email = $1", [email]);
    throw Object.assign(new Error("That code has expired. Request a new one"), { status: 400 });
  }
  if (row.attempts >= 5) {
    await query("DELETE FROM login_otps WHERE email = $1", [email]);
    throw Object.assign(new Error("Too many attempts. Request a new code"), { status: 400 });
  }
  if (!hashesMatch(row.code_hash, hashOtp(email, code))) {
    await query("UPDATE login_otps SET attempts = attempts + 1 WHERE email = $1", [email]);
    throw Object.assign(new Error("That code is incorrect"), { status: 401 });
  }

  await query("DELETE FROM login_otps WHERE email = $1", [email]);
  const { rows } = await query(
    "UPDATE users SET email_verified = TRUE WHERE email = $1 RETURNING *",
    [email],
  );
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
        `INSERT INTO talent (id, user_id, name, type, image, followers, collaborations, tags, age, price, proposed_price, agreed_price, processing_fee, verified, views, shortlists)
         VALUES ($1,$2,$3,$4,$5,'0',0, ARRAY['Creator']::text[], $6, '₹28,000', 28000, NULL, 0, FALSE, 0, 0)`,
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
  const licenseFee = profile.agreed_price ?? profile.proposed_price ?? rupeesFromText(profile.price);
  const protection = Number(profile.processing_fee) || 0;
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

export async function requireAdmin(userId) {
  const user = await getUser(userId);
  if (user.role !== "admin") {
    throw Object.assign(new Error("Admin access required"), { status: 403 });
  }
  return user;
}

export async function listAdminTalent(adminUserId) {
  await requireAdmin(adminUserId);
  const { rows } = await query("SELECT * FROM talent ORDER BY created_at DESC");
  return rows.map(publicTalent);
}

export async function updateAdminTalent(adminUserId, talentId, input) {
  await requireAdmin(adminUserId);
  const agreed = Math.max(0, Math.round(Number(input.agreedPrice) || 0));
  const fee = Math.max(0, Math.round(Number(input.processingFee) || 0));
  const { rows } = await query(
    `UPDATE talent
     SET verified = $2, agreed_price = $3, processing_fee = $4, price = $5
     WHERE id = $1
     RETURNING *`,
    [talentId, Boolean(input.verified), agreed, fee, rupeesLabel(agreed)],
  );
  if (!rows[0]) throw Object.assign(new Error("Talent not found"), { status: 404 });
  return publicTalent(rows[0]);
}
