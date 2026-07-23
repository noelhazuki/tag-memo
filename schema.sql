-- tag-memo D1スキーマ

CREATE TABLE IF NOT EXISTS genres (
  name TEXT PRIMARY KEY,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tags (
  name TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  genre TEXT NOT NULL,
  memo TEXT,
  link TEXT,
  tags TEXT,
  created_at TEXT NOT NULL
);

-- 初期データ
INSERT OR IGNORE INTO genres (name, sort_order) VALUES ('AI操作', 0);

INSERT OR IGNORE INTO tags (name) VALUES
  ('Claude'), ('ChatGPT'), ('Cloudflare'), ('React'),
  ('デプロイ'), ('GitHub'), ('用語'), ('KV');
