-- tag-memo D1スキーマ

CREATE TABLE IF NOT EXISTS genres (
  name TEXT PRIMARY KEY,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tags (
  name TEXT NOT NULL,
  genre TEXT NOT NULL,
  PRIMARY KEY (name, genre)
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

INSERT OR IGNORE INTO tags (name, genre) VALUES
  ('Claude', 'AI操作'), ('ChatGPT', 'AI操作'), ('Cloudflare', 'AI操作'), ('React', 'AI操作'),
  ('デプロイ', 'AI操作'), ('GitHub', 'AI操作'), ('用語', 'AI操作'), ('KV', 'AI操作');
