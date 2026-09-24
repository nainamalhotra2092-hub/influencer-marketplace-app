CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('artist', 'buyer')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  company TEXT NOT NULL DEFAULT '',
  gstin TEXT NOT NULL DEFAULT '',
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
  age INTEGER,
  ethnicity TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  talent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS talent (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  image TEXT NOT NULL,
  followers TEXT NOT NULL DEFAULT '0',
  collaborations INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  age INTEGER NOT NULL DEFAULT 18,
  price TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  shortlists INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media (
  id SERIAL PRIMARY KEY,
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  image TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS licenses (
  id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL REFERENCES talent(id) ON DELETE CASCADE,
  talent_name TEXT NOT NULL,
  buyer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  usage TEXT NOT NULL,
  duration TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  license_fee INTEGER NOT NULL,
  protection INTEGER NOT NULL,
  total INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_otps (
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS media_owner_idx ON media (owner_id);
CREATE INDEX IF NOT EXISTS licenses_talent_idx ON licenses (talent_id);
CREATE INDEX IF NOT EXISTS licenses_buyer_idx ON licenses (buyer_id);
