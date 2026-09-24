CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('artist', 'buyer', 'admin')),
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
  proposed_price INTEGER,
  agreed_price INTEGER,
  processing_fee INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
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

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('artist', 'buyer', 'admin'));

ALTER TABLE talent ADD COLUMN IF NOT EXISTS proposed_price INTEGER;
ALTER TABLE talent ADD COLUMN IF NOT EXISTS agreed_price INTEGER;
ALTER TABLE talent ADD COLUMN IF NOT EXISTS processing_fee INTEGER NOT NULL DEFAULT 0;
ALTER TABLE talent ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE talent
SET proposed_price = CAST(NULLIF(regexp_replace(price, '[^0-9]', '', 'g'), '') AS INTEGER)
WHERE proposed_price IS NULL;

CREATE TABLE IF NOT EXISTS signup_otps (
  target TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email')),
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (target, channel)
);

DELETE FROM signup_otps WHERE channel <> 'email';
ALTER TABLE signup_otps DROP CONSTRAINT IF EXISTS signup_otps_channel_check;
ALTER TABLE signup_otps ADD CONSTRAINT signup_otps_channel_check CHECK (channel IN ('email'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE talent ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT '';
ALTER TABLE talent ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS shortlists (
  buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  talent_id TEXT NOT NULL REFERENCES talent(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (buyer_id, talent_id)
);

CREATE INDEX IF NOT EXISTS shortlists_buyer_idx ON shortlists (buyer_id);
CREATE INDEX IF NOT EXISTS shortlists_talent_idx ON shortlists (talent_id);

UPDATE talent SET city = 'Mumbai', bio = 'Actor and creator based in Mumbai.' WHERE id = 'tal_aanya' AND city = '';
UPDATE talent SET city = 'Delhi', bio = 'Screen actor and commercial model.' WHERE id = 'tal_arjun' AND city = '';
UPDATE talent SET city = 'Kolkata', bio = 'Independent artist and musician.' WHERE id = 'tal_mira' AND city = '';
UPDATE talent SET city = 'Bengaluru', bio = 'Creator and live performer.' WHERE id = 'tal_kabir' AND city = '';
UPDATE talent SET city = 'Mumbai', bio = 'Fashion model and film actor.' WHERE id = 'tal_tara' AND city = '';
UPDATE talent SET city = 'Pune', bio = 'Actor and voice artist.' WHERE id = 'tal_dev' AND city = '';

ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS followers TEXT NOT NULL DEFAULT '';
ALTER TABLE talent ADD COLUMN IF NOT EXISTS instagram TEXT NOT NULL DEFAULT '';

ALTER TABLE media ADD COLUMN IF NOT EXISTS cipher BYTEA;
ALTER TABLE media ADD COLUMN IF NOT EXISTS iv BYTEA;
ALTER TABLE media ADD COLUMN IF NOT EXISTS tag BYTEA;
ALTER TABLE media ADD COLUMN IF NOT EXISTS mime TEXT NOT NULL DEFAULT 'image/jpeg';
ALTER TABLE media ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE;
