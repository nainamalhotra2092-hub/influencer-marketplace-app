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

const talent = [
  {
    id: "tal_aanya",
    name: "Aanya Rao",
    type: "Actor · Creator",
    image: SAMPLE_IMAGES[0],
    followers: "824K",
    collaborations: 46,
    tags: ["Female", "Actor", "Creator"],
    age: 26,
    price: "₹42,000",
    views: 2418,
    shortlists: 34,
  },
  {
    id: "tal_arjun",
    name: "Arjun Mehta",
    type: "Actor · Model",
    image: SAMPLE_IMAGES[1],
    followers: "356K",
    collaborations: 31,
    tags: ["Male", "Actor", "Model"],
    age: 29,
    price: "₹36,000",
    views: 1104,
    shortlists: 18,
  },
  {
    id: "tal_mira",
    name: "Mira Sen",
    type: "Artist · Musician",
    image: SAMPLE_IMAGES[2],
    followers: "1.2M",
    collaborations: 68,
    tags: ["Female", "Artist"],
    age: 32,
    price: "₹58,000",
    views: 3901,
    shortlists: 52,
  },
  {
    id: "tal_kabir",
    name: "Kabir Anand",
    type: "Creator · Performer",
    image: SAMPLE_IMAGES[3],
    followers: "219K",
    collaborations: 24,
    tags: ["Male", "Creator"],
    age: 24,
    price: "₹28,000",
    views: 812,
    shortlists: 11,
  },
  {
    id: "tal_tara",
    name: "Tara Kapoor",
    type: "Model · Actor",
    image: SAMPLE_IMAGES[4],
    followers: "617K",
    collaborations: 39,
    tags: ["Female", "Model", "Actor"],
    age: 27,
    price: "₹39,000",
    views: 1760,
    shortlists: 27,
  },
  {
    id: "tal_dev",
    name: "Dev Malhotra",
    type: "Actor · Voice artist",
    image: SAMPLE_IMAGES[5],
    followers: "403K",
    collaborations: 35,
    tags: ["Male", "Actor", "Artist"],
    age: 41,
    price: "₹44,000",
    views: 1544,
    shortlists: 22,
  },
];

const users = [];
const media = [
  { id: 1, ownerId: "tal_aanya", title: "Front profile", image: SAMPLE_IMAGES[0] },
  { id: 2, ownerId: "tal_aanya", title: "Side profile", image: SAMPLE_IMAGES[6] },
  { id: 3, ownerId: "tal_aanya", title: "Joy · expression", image: SAMPLE_IMAGES[4] },
];
const licenses = [];
let mediaSeq = 10;

function inAgeRange(age, ranges) {
  if (!ranges.length) return true;
  return ranges.some((range) => {
    if (range === "18-25" || range === "18–25") return age >= 18 && age <= 25;
    if (range === "26-35" || range === "26–35") return age >= 26 && age <= 35;
    if (range === "36-50" || range === "36–50") return age >= 36 && age <= 50;
    return age >= 50;
  });
}

export function listTalent({ query = "", gender = "All", categories = [], ages = [] } = {}) {
  const needle = String(query).trim().toLowerCase();
  return talent.filter((profile) => {
    const matchesGender = gender === "All" || profile.tags.includes(gender);
    const matchesCategory = categories.length === 0 || categories.some((category) => profile.tags.includes(category));
    const matchesAge = inAgeRange(profile.age, ages);
    const matchesQuery =
      needle.length === 0 ||
      profile.name.toLowerCase().includes(needle) ||
      profile.type.toLowerCase().includes(needle) ||
      profile.tags.some((tag) => tag.toLowerCase().includes(needle));
    return matchesGender && matchesCategory && matchesAge && matchesQuery;
  });
}

export function registerUser(input) {
  const user = {
    id: id("usr"),
    role: input.role === "buyer" ? "buyer" : "artist",
    name: String(input.name || "").trim(),
    phone: String(input.phone || "").trim(),
    email: String(input.email || "").trim().toLowerCase(),
    company: String(input.company || "").trim(),
    gstin: String(input.gstin || "").trim(),
    emailVerified: Boolean(input.emailVerified),
    identityVerified: Boolean(input.identityVerified),
    age: null,
    ethnicity: "",
    city: "",
    title: "",
    bio: "",
    talentId: null,
  };

  if (!user.name || !user.email) {
    throw Object.assign(new Error("Name and email are required"), { status: 400 });
  }

  users.push(user);
  return publicUser(user);
}

export function verifyUser(userId, field) {
  const user = users.find((item) => item.id === userId);
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  if (field === "email") user.emailVerified = true;
  if (field === "identity") user.identityVerified = true;
  return publicUser(user);
}

export function completeProfile(userId, input) {
  const user = users.find((item) => item.id === userId);
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

  user.age = Number(input.age) || null;
  user.ethnicity = String(input.ethnicity || "");
  user.city = String(input.city || "");
  user.title = String(input.title || "");
  user.bio = String(input.bio || "");

  if (user.role === "artist" && !user.talentId) {
    const card = {
      id: id("tal"),
      name: user.name,
      type: user.title || "Creator",
      image: SAMPLE_IMAGES[0],
      followers: "0",
      collaborations: 0,
      tags: ["Creator"],
      age: user.age || 18,
      price: "₹28,000",
      views: 0,
      shortlists: 0,
    };
    talent.unshift(card);
    user.talentId = card.id;
  }

  return publicUser(user);
}

export function getStudio(userId) {
  const user = users.find((item) => item.id === userId);
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  const ownerId = user.talentId || user.id;
  const uploads = media.filter((item) => item.ownerId === ownerId || item.ownerId === user.id);
  const card = talent.find((item) => item.id === user.talentId);
  const completion = Math.min(100, 40 + uploads.length * 8 + (user.bio ? 12 : 0) + (user.identityVerified ? 12 : 0));
  const relatedLicenses = licenses.filter((item) => item.talentId === user.talentId);

  return {
    user: publicUser(user),
    uploads,
    completion,
    stats: {
      views: card?.views ?? 0,
      shortlists: card?.shortlists ?? 0,
      licenses: relatedLicenses.length,
      earnings: relatedLicenses.reduce((sum, item) => sum + item.total, 0),
    },
  };
}

export function addMedia(userId) {
  const user = users.find((item) => item.id === userId);
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  const ownerId = user.talentId || user.id;
  const item = {
    id: ++mediaSeq,
    ownerId,
    title: "New expression",
    image: SAMPLE_IMAGES[mediaSeq % SAMPLE_IMAGES.length],
  };
  media.push(item);
  return item;
}

export function removeMedia(userId, mediaId) {
  const user = users.find((item) => item.id === userId);
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  const ownerId = user.talentId || user.id;
  const index = media.findIndex((item) => String(item.id) === String(mediaId) && (item.ownerId === ownerId || item.ownerId === user.id));
  if (index === -1) throw Object.assign(new Error("Media not found"), { status: 404 });
  const [removed] = media.splice(index, 1);
  return removed;
}

export function createLicense(input) {
  const profile = talent.find((item) => item.id === input.talentId);
  if (!profile) throw Object.assign(new Error("Talent not found"), { status: 404 });
  const licenseFee = Number(String(profile.price).replace(/[₹,]/g, ""));
  const protection = 4200;
  const record = {
    id: id("lic"),
    talentId: profile.id,
    talentName: profile.name,
    buyerId: input.buyerId || null,
    usage: String(input.usage || "Film & streaming"),
    duration: String(input.duration || "12 months"),
    description: String(input.description || ""),
    licenseFee,
    protection,
    total: licenseFee + protection,
    status: "pending_creator_approval",
    createdAt: new Date().toISOString(),
  };
  licenses.push(record);
  return record;
}

export function listLicenses() {
  return licenses;
}

function publicUser(user) {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone,
    company: user.company,
    emailVerified: user.emailVerified,
    identityVerified: user.identityVerified,
    age: user.age,
    ethnicity: user.ethnicity,
    city: user.city,
    title: user.title,
    bio: user.bio,
    talentId: user.talentId,
  };
}

export { SAMPLE_IMAGES };
