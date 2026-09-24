import crypto from "node:crypto";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"]);

export function mediaKey() {
  const hex = String(process.env.MEDIA_ENCRYPTION_KEY || "").trim();
  if (/^[0-9a-fA-F]{64}$/.test(hex)) return Buffer.from(hex, "hex");
  return crypto.createHash("sha256").update("facetroop-local-media-key").digest();
}

export function encryptImage(buffer, mime) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) {
    throw Object.assign(new Error("Choose an image to upload"), { status: 400 });
  }
  if (buffer.length > MAX_BYTES) {
    throw Object.assign(new Error("Image must be under 8 MB"), { status: 413 });
  }
  const type = String(mime || "").toLowerCase();
  if (!ALLOWED.has(type) && !type.startsWith("image/")) {
    throw Object.assign(new Error("Only image files can be uploaded"), { status: 400 });
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", mediaKey(), iv);
  const data = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return { cipher: data, iv, tag: cipher.getAuthTag(), mime: type || "image/jpeg" };
}

export function decryptImage(row) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", mediaKey(), Buffer.from(row.iv));
  decipher.setAuthTag(Buffer.from(row.tag));
  return Buffer.concat([decipher.update(Buffer.from(row.cipher)), decipher.final()]);
}
