import crypto from "node:crypto";
import { query, withTransaction } from "./db.js";
import { decryptImage, encryptImage } from "./media-crypto.js";
import { mailConfigured, sendLoginOtp, sendOtpEmail } from "./mail.js";

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

function formatDob(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return String(value).slice(0, 10);
}

function parseDob(value) {
  const text = formatDob(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw Object.assign(new Error("Enter a valid date of birth"), { status: 400 });
  }
  const [year, month, day] = text.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw Object.assign(new Error("Enter a valid date of birth"), { status: 400 });
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) {
    throw Object.assign(new Error("Date of birth cannot be in the future"), { status: 400 });
  }
  return text;
}

function ageFromDob(value) {
  const text = parseDob(value);
  const [year, month, day] = text.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age -= 1;
  if (age < 0 || age > 120) {
    throw Object.assign(new Error("Enter a valid date of birth"), { status: 400 });
  }
  return age;
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
    dob: formatDob(row.dob),
    age: row.age,
    ethnicity: row.ethnicity,
    city: row.city,
    title: row.title,
    bio: row.bio,
    instagram: row.instagram || "",
    followers: row.followers || "",
    talentId: row.talent_id,
  };
}

function rupeesFromText(value) {
  return Number(String(value || "0").replace(/[₹,]/g, "")) || 0;
}

function rupeesLabel(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function normalizeInstagram(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^https?:\/\//i.test(text)) return text;
  const handle = text.replace(/^@/, "").replace(/^(www\.)?instagram\.com\//i, "");
  return handle ? `https://instagram.com/${handle}` : "";
}

function buyerProcessingFee(agreed) {
  return Math.max(0, Math.round(Number(agreed || 0) * 0.1));
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
    city: row.city || "",
    bio: row.bio || "",
    instagram: row.instagram || "",
    shortlisted: Boolean(row.shortlisted),
    price: rupeesLabel(agreed),
    proposedPrice: proposed,
    agreedPrice: agreed,
    processingFee: buyerProcessingFee(agreed),
    verified: Boolean(row.verified),
    ethnicity: row.ethnicity || "",
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

export async function listTalent({ query: q = "", gender = "All", categories = [], ages = [], buyerId = "", shortlistedOnly = false } = {}) {
  const needle = String(q).trim();
  const age = ageSql(ages);
  const params = [needle, gender, categories, buyerId || "", Boolean(shortlistedOnly)];
  const { rows } = await query(
    `SELECT talent.*,
            ($4 <> '' AND EXISTS (
              SELECT 1 FROM shortlists s WHERE s.talent_id = talent.id AND s.buyer_id = $4
            )) AS shortlisted
     FROM talent
     WHERE (
       $1 = ''
       OR name ILIKE '%' || $1 || '%'
       OR type ILIKE '%' || $1 || '%'
       OR city ILIKE '%' || $1 || '%'
       OR bio ILIKE '%' || $1 || '%'
       OR EXISTS (SELECT 1 FROM unnest(tags) AS tag WHERE tag ILIKE '%' || $1 || '%')
     )
     AND ($2 = 'All' OR $2 = ANY(tags))
     AND (cardinality($3::text[]) = 0 OR tags && $3::text[])
     AND verified = TRUE
     AND ${age.sql}
     AND ($5 = FALSE OR EXISTS (
       SELECT 1 FROM shortlists s WHERE s.talent_id = talent.id AND s.buyer_id = $4
     ))
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
        false,
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

export async function completeProfile(userId, input) {
  return withTransaction(async (db) => {
    const existing = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
    if (!existing.rows[0]) throw Object.assign(new Error("User not found"), { status: 404 });
    const user = existing.rows[0];
    let talentId = user.talent_id;
    const dob = parseDob(input.dob);
    const age = ageFromDob(dob);
    const title = String(input.title || "").trim();
    const city = String(input.city || "").trim();
    const bio = String(input.bio || "").trim();
    const ethnicity = String(input.ethnicity || "").trim();
    const instagram = normalizeInstagram(input.instagram);
    const followers = String(input.followers || "").trim() || "0";

    if (user.role === "artist" && !talentId) {
      talentId = id("tal");
      await db.query(
        `INSERT INTO talent (id, user_id, name, type, image, followers, collaborations, tags, age, city, bio, instagram, price, proposed_price, agreed_price, processing_fee, verified, views, shortlists)
         VALUES ($1,$2,$3,$4,$5,$6,0, ARRAY['Creator']::text[], $7, $8, $9, $10, '₹28,000', 28000, NULL, 0, FALSE, 0, 0)`,
        [talentId, userId, user.name, title || "Creator", SAMPLE_IMAGES[0], followers, age, city, bio, instagram],
      );
    } else if (user.role === "artist" && talentId) {
      await db.query(
        `UPDATE talent SET type = $2, age = $3, city = $4, bio = $5, instagram = $6, followers = $7 WHERE id = $1`,
        [talentId, title || "Creator", age, city, bio, instagram, followers],
      );
    }

    const updated = await db.query(
      `UPDATE users
       SET dob = $2, age = $3, ethnicity = $4, city = $5, title = $6, bio = $7, instagram = $8, followers = $9, talent_id = $10
       WHERE id = $1
       RETURNING *`,
      [userId, dob, age, ethnicity, city, title, bio, instagram, followers, talentId],
    );
    return publicUser(updated.rows[0]);
  });
}

function publicMedia(row, userId) {
  if (!row) return null;
  return {
    id: row.id,
    ownerId: row.owner_id || row.ownerId,
    title: row.title,
    image: row.cipher ? `/api/users/${userId}/media/${row.id}/file` : row.image,
    primary: Boolean(row.is_primary),
  };
}

function coverImageFor(talentId, row) {
  if (row.cipher) return `/api/talent/${talentId}/media/${row.id}/file`;
  return row.image;
}

async function applyPrimaryMedia(user, mediaId) {
  const ownerId = user.talentId || user.id;
  const found = await query("SELECT * FROM media WHERE id = $1 AND (owner_id = $2 OR owner_id = $3)", [mediaId, ownerId, user.id]);
  const row = found.rows[0];
  if (!row) throw Object.assign(new Error("Media not found"), { status: 404 });
  await query("UPDATE media SET is_primary = FALSE WHERE owner_id = $1 OR owner_id = $2", [ownerId, user.id]);
  await query("UPDATE media SET is_primary = TRUE WHERE id = $1", [mediaId]);
  if (user.talentId) {
    await query("UPDATE talent SET image = $2 WHERE id = $1", [user.talentId, coverImageFor(user.talentId, row)]);
  }
  return publicMedia({ ...row, is_primary: true }, user.id);
}

async function ensureFirstImagePrimary(user) {
  const ownerId = user.talentId || user.id;
  const { rows } = await query(
    `SELECT id, is_primary FROM media WHERE owner_id = $1 OR owner_id = $2 ORDER BY id ASC`,
    [ownerId, user.id],
  );
  if (!rows.length || rows.some((item) => item.is_primary)) return;
  await applyPrimaryMedia(user, rows[0].id);
}

export async function backfillPrimaryCovers() {
  const { rows } = await query("SELECT id, talent_id FROM users WHERE role = 'artist'");
  for (const row of rows) {
    await ensureFirstImagePrimary({ id: row.id, talentId: row.talent_id });
  }
}

export async function setPrimaryMedia(userId, mediaId) {
  const user = await getUser(userId);
  return applyPrimaryMedia(user, mediaId);
}

export async function getStudio(userId) {
  const user = await getUser(userId);
  await ensureFirstImagePrimary(user);
  const ownerId = user.talentId || user.id;
  const uploads = await query(
    `SELECT id, owner_id, title, image, cipher, mime, is_primary
     FROM media WHERE owner_id = $1 OR owner_id = $2 ORDER BY id ASC`,
    [ownerId, user.id],
  );
  const card = user.talentId ? await query("SELECT * FROM talent WHERE id = $1", [user.talentId]) : { rows: [] };
  const related = user.talentId
    ? await query("SELECT COUNT(*)::int AS count, COALESCE(SUM(total),0)::int AS earnings FROM licenses WHERE talent_id = $1", [user.talentId])
    : { rows: [{ count: 0, earnings: 0 }] };
  const talent = card.rows[0];
  const completion = Math.min(100, 40 + uploads.rows.length * 8 + (user.bio ? 12 : 0) + (user.identityVerified ? 12 : 0));

  return {
    user: {
      ...user,
      instagram: user.instagram || talent?.instagram || "",
      followers: user.followers || talent?.followers || "",
    },
    uploads: uploads.rows.map((row) => publicMedia(row, userId)),
    completion,
    stats: {
      views: card.rows[0]?.views ?? 0,
      shortlists: card.rows[0]?.shortlists ?? 0,
      licenses: related.rows[0].count,
      earnings: related.rows[0].earnings,
    },
  };
}

export async function addMedia(userId, input) {
  const user = await getUser(userId);
  const ownerId = user.talentId || user.id;
  const existing = await query("SELECT COUNT(*)::int AS count FROM media WHERE owner_id = $1 OR owner_id = $2", [ownerId, user.id]);
  if (existing.rows[0].count >= 12) {
    throw Object.assign(new Error("You can upload up to 12 images"), { status: 400 });
  }

  const raw = String(input.data || "").replace(/\s/g, "");
  let buffer;
  try {
    buffer = Buffer.from(raw, "base64");
  } catch {
    throw Object.assign(new Error("Could not read that image"), { status: 400 });
  }
  const encrypted = encryptImage(buffer, input.mime);
  const title = String(input.name || "Studio photo")
    .replace(/\.[^.]+$/, "")
    .trim()
    .slice(0, 80) || "Studio photo";

  const { rows } = await query(
    `INSERT INTO media (owner_id, title, image, cipher, iv, tag, mime, is_primary)
     VALUES ($1, $2, '', $3, $4, $5, $6, FALSE)
     RETURNING id, owner_id, title, image, cipher, mime, is_primary`,
    [ownerId, title, encrypted.cipher, encrypted.iv, encrypted.tag, encrypted.mime],
  );
  if (existing.rows[0].count === 0) {
    return applyPrimaryMedia(user, rows[0].id);
  }
  return publicMedia(rows[0], userId);
}

export async function getMediaFile(userId, mediaId) {
  const user = await getUser(userId);
  const ownerId = user.talentId || user.id;
  const { rows } = await query(
    `SELECT * FROM media WHERE id = $1 AND (owner_id = $2 OR owner_id = $3)`,
    [mediaId, ownerId, user.id],
  );
  const row = rows[0];
  if (!row) throw Object.assign(new Error("Media not found"), { status: 404 });
  if (row.cipher && row.iv && row.tag) {
    return { mime: row.mime || "image/jpeg", buffer: decryptImage(row) };
  }
  throw Object.assign(new Error("Media not found"), { status: 404 });
}

export async function removeMedia(userId, mediaId) {
  const user = await getUser(userId);
  const ownerId = user.talentId || user.id;
  const { rows } = await query(
    `DELETE FROM media
     WHERE id = $1 AND (owner_id = $2 OR owner_id = $3)
     RETURNING id, owner_id, title, image, cipher, mime, is_primary`,
    [mediaId, ownerId, user.id],
  );
  if (!rows[0]) throw Object.assign(new Error("Media not found"), { status: 404 });
  if (rows[0].is_primary) {
    const remaining = await query(
      `SELECT id FROM media WHERE owner_id = $1 OR owner_id = $2 ORDER BY id ASC LIMIT 1`,
      [ownerId, user.id],
    );
    if (remaining.rows[0]) {
      await applyPrimaryMedia(user, remaining.rows[0].id);
    }
  }
  return publicMedia(rows[0], userId);
}

export async function createLicense(input) {
  const { rows: talentRows } = await query("SELECT * FROM talent WHERE id = $1", [input.talentId]);
  const profile = talentRows[0];
  if (!profile) throw Object.assign(new Error("Talent not found"), { status: 404 });
  const licenseFee = profile.agreed_price ?? profile.proposed_price ?? rupeesFromText(profile.price);
  const protection = buyerProcessingFee(licenseFee);
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

export async function getAdminTalentDetail(adminUserId, talentId) {
  await requireAdmin(adminUserId);
  const talent = await query("SELECT * FROM talent WHERE id = $1", [talentId]);
  const row = talent.rows[0];
  if (!row) throw Object.assign(new Error("Talent not found"), { status: 404 });

  const linked = await query("SELECT * FROM users WHERE id = $1 OR talent_id = $2 LIMIT 1", [row.user_id, row.id]);
  const person = linked.rows[0];
  const owners = [...new Set([row.id, row.user_id, person?.id].filter(Boolean))];
  const media = await query(
    `SELECT id, owner_id, title, image, cipher, mime FROM media WHERE owner_id = ANY($1::text[]) ORDER BY id`,
    [owners],
  );

  return {
    talent: {
      ...publicTalent(row),
      ethnicity: person?.ethnicity || "",
      city: row.city || person?.city || "",
      bio: row.bio || person?.bio || "",
      instagram: row.instagram || person?.instagram || "",
      followers: row.followers || person?.followers || "0",
      age: row.age ?? person?.age ?? 0,
    },
    uploads: media.rows.map((item) => ({
      id: item.id,
      ownerId: item.owner_id,
      title: item.title,
      image: item.cipher
        ? `/api/admin/talent/${row.id}/media/${item.id}/file?userId=${encodeURIComponent(adminUserId)}`
        : item.image,
    })),
  };
}

export async function getAdminMediaFile(adminUserId, talentId, mediaId) {
  await requireAdmin(adminUserId);
  const talent = await query("SELECT id, user_id FROM talent WHERE id = $1", [talentId]);
  if (!talent.rows[0]) throw Object.assign(new Error("Talent not found"), { status: 404 });
  const { rows } = await query("SELECT * FROM media WHERE id = $1", [mediaId]);
  const file = rows[0];
  if (!file) throw Object.assign(new Error("Media not found"), { status: 404 });
  const linked = await query("SELECT id FROM users WHERE id = $1 OR talent_id = $2", [talent.rows[0].user_id, talentId]);
  const allowed = new Set([talent.rows[0].id, talent.rows[0].user_id, ...linked.rows.map((item) => item.id)].filter(Boolean));
  if (!allowed.has(file.owner_id)) throw Object.assign(new Error("Media not found"), { status: 404 });
  if (file.cipher && file.iv && file.tag) {
    return { mime: file.mime || "image/jpeg", buffer: decryptImage(file) };
  }
  throw Object.assign(new Error("Media not found"), { status: 404 });
}

export async function getPublicTalentDetail(talentId) {
  const talent = await query("SELECT * FROM talent WHERE id = $1 AND verified = TRUE", [talentId]);
  const row = talent.rows[0];
  if (!row) throw Object.assign(new Error("Talent not found"), { status: 404 });

  const linked = await query("SELECT * FROM users WHERE id = $1 OR talent_id = $2 LIMIT 1", [row.user_id, row.id]);
  const person = linked.rows[0];
  const owners = [...new Set([row.id, row.user_id, person?.id].filter(Boolean))];
  const media = await query(
    `SELECT id, owner_id, title, image, cipher, mime FROM media WHERE owner_id = ANY($1::text[]) ORDER BY id`,
    [owners],
  );

  return {
    talent: {
      ...publicTalent(row),
      ethnicity: person?.ethnicity || "",
      city: row.city || person?.city || "",
      bio: row.bio || person?.bio || "",
      instagram: row.instagram || person?.instagram || "",
      followers: row.followers || person?.followers || "0",
      age: row.age ?? person?.age ?? 0,
    },
    uploads: media.rows.map((item) => ({
      id: item.id,
      ownerId: item.owner_id,
      title: item.title,
      image: item.cipher ? `/api/talent/${row.id}/media/${item.id}/file` : item.image,
    })),
  };
}

export async function getPublicTalentMediaFile(talentId, mediaId) {
  const talent = await query("SELECT id, user_id, verified FROM talent WHERE id = $1", [talentId]);
  if (!talent.rows[0]) throw Object.assign(new Error("Talent not found"), { status: 404 });
  const { rows } = await query("SELECT * FROM media WHERE id = $1", [mediaId]);
  const file = rows[0];
  if (!file) throw Object.assign(new Error("Media not found"), { status: 404 });
  const linked = await query("SELECT id FROM users WHERE id = $1 OR talent_id = $2", [talent.rows[0].user_id, talentId]);
  const allowed = new Set([talent.rows[0].id, talent.rows[0].user_id, ...linked.rows.map((item) => item.id)].filter(Boolean));
  if (!allowed.has(file.owner_id)) throw Object.assign(new Error("Media not found"), { status: 404 });
  if (!talent.rows[0].verified && !file.is_primary) {
    throw Object.assign(new Error("Media not found"), { status: 404 });
  }
  if (file.cipher && file.iv && file.tag) {
    return { mime: file.mime || "image/jpeg", buffer: decryptImage(file) };
  }
  throw Object.assign(new Error("Media not found"), { status: 404 });
}

export async function updateAdminTalent(adminUserId, talentId, input) {
  await requireAdmin(adminUserId);
  const agreed = Math.max(0, Math.round(Number(input.agreedPrice) || 0));
  const fee = buyerProcessingFee(agreed);
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

export async function toggleShortlist(userId, talentId) {
  const user = await getUser(userId);
  if (user.role !== "buyer") {
    throw Object.assign(new Error("Only buyers can shortlist talent"), { status: 403 });
  }
  const talent = await query("SELECT id FROM talent WHERE id = $1 AND verified = TRUE", [talentId]);
  if (!talent.rows[0]) throw Object.assign(new Error("Talent not found"), { status: 404 });

  const existing = await query("SELECT 1 FROM shortlists WHERE buyer_id = $1 AND talent_id = $2", [userId, talentId]);
  if (existing.rows[0]) {
    await query("DELETE FROM shortlists WHERE buyer_id = $1 AND talent_id = $2", [userId, talentId]);
  } else {
    await query("INSERT INTO shortlists (buyer_id, talent_id) VALUES ($1, $2)", [userId, talentId]);
  }
  const count = await query("SELECT COUNT(*)::int AS count FROM shortlists WHERE talent_id = $1", [talentId]);
  await query("UPDATE talent SET shortlists = $2 WHERE id = $1", [talentId, count.rows[0].count]);
  return { talentId, shortlisted: !existing.rows[0], shortlists: count.rows[0].count };
}

function signupEmail(input) {
  const email = String(input.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw Object.assign(new Error("Enter a valid email address"), { status: 400 });
  }
  return email;
}

export async function requestSignupOtp(input) {
  const target = signupEmail(input);

  const existing = await query("SELECT id FROM users WHERE email = $1", [target]);
  if (existing.rows[0]) {
    throw Object.assign(new Error("An account with this email already exists"), { status: 409 });
  }

  const recent = await query("SELECT created_at FROM signup_otps WHERE target = $1 AND channel = 'email'", [target]);
  if (recent.rows[0]) {
    const ageMs = Date.now() - new Date(recent.rows[0].created_at).getTime();
    if (ageMs < 30_000) {
      throw Object.assign(new Error("Please wait a few seconds before requesting another code"), { status: 429 });
    }
  }

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await query(
    `INSERT INTO signup_otps (target, channel, code_hash, expires_at, attempts, created_at)
     VALUES ($1, 'email', $2, $3, 0, NOW())
     ON CONFLICT (target, channel) DO UPDATE SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at, attempts = 0, created_at = NOW()`,
    [target, hashOtp(target, code), expiresAt.toISOString()],
  );

  const delivered = (await sendOtpEmail(target, code, "signup")).delivered;
  return {
    target,
    sent: true,
    delivered,
    ...(delivered || mailConfigured() ? {} : { devOtp: code }),
  };
}

export async function verifySignupOtp(input) {
  const target = signupEmail(input);
  const code = String(input.code || "").trim();
  if (!/^\d{6}$/.test(code)) {
    throw Object.assign(new Error("Enter the 6-digit code"), { status: 400 });
  }

  const otp = await query("SELECT * FROM signup_otps WHERE target = $1 AND channel = 'email'", [target]);
  const row = otp.rows[0];
  if (!row) throw Object.assign(new Error("Request a new verification code"), { status: 400 });
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await query("DELETE FROM signup_otps WHERE target = $1 AND channel = 'email'", [target]);
    throw Object.assign(new Error("That code has expired. Request a new one"), { status: 400 });
  }
  if (row.attempts >= 5) {
    await query("DELETE FROM signup_otps WHERE target = $1 AND channel = 'email'", [target]);
    throw Object.assign(new Error("Too many attempts. Request a new code"), { status: 400 });
  }
  if (!hashesMatch(row.code_hash, hashOtp(target, code))) {
    await query("UPDATE signup_otps SET attempts = attempts + 1 WHERE target = $1 AND channel = 'email'", [target]);
    throw Object.assign(new Error("That code is incorrect"), { status: 401 });
  }

  await query("DELETE FROM signup_otps WHERE target = $1 AND channel = 'email'", [target]);
  return { verified: true };
}
