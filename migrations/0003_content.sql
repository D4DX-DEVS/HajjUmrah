-- site content lives in D1 (it used to be JSON files in content/, kept only as the seed for scripts/seed-d1.mjs)
CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image TEXT,
  author_id INTEGER NOT NULL,
  author_name TEXT NOT NULL,
  author_slug TEXT NOT NULL,
  categories TEXT NOT NULL, -- JSON array of category slugs, primary first
  tags TEXT NOT NULL,       -- JSON array of tag slugs
  rev INTEGER NOT NULL DEFAULT 1 -- bumped on every edit; the admin sends it back to detect concurrent edits
);
CREATE INDEX posts_date ON posts (date);
-- small documents: categories, tags, videos, authors (bios), each a JSON array
CREATE TABLE docs (
  key TEXT PRIMARY KEY,
  json TEXT NOT NULL,
  rev INTEGER NOT NULL DEFAULT 1
);
