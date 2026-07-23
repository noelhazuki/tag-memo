// tag-memo API Worker

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function withCors(res) {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, X-Auth-Password");
  return new Response(res.body, { status: res.status, headers });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // 合言葉チェック
    const password = request.headers.get("X-Auth-Password");
    if (password !== env.AUTH_PASSWORD) {
      return withCors(jsonResponse({ error: "unauthorized" }, 401));
    }

    try {
      // ---- ジャンル ----
      if (path === "/api/genres" && request.method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT name FROM genres ORDER BY sort_order ASC"
        ).all();
        return withCors(jsonResponse(results.map((r) => r.name)));
      }

      if (path === "/api/genres" && request.method === "POST") {
        const body = await request.json();
        const name = (body.name || "").trim();
        if (!name) return withCors(jsonResponse({ error: "name required" }, 400));
        const countRow = await env.DB.prepare("SELECT COUNT(*) as c FROM genres").first();
        await env.DB.prepare(
          "INSERT OR IGNORE INTO genres (name, sort_order) VALUES (?, ?)"
        ).bind(name, countRow.c).run();
        return withCors(jsonResponse({ ok: true }));
      }

      if (path.startsWith("/api/genres/") && request.method === "DELETE") {
        const name = decodeURIComponent(path.split("/")[3]);
        await env.DB.prepare("DELETE FROM genres WHERE name = ?").bind(name).run();
        return withCors(jsonResponse({ ok: true }));
      }

      // ---- タグ（ジャンルごと） ----
      if (path === "/api/tags" && request.method === "GET") {
        const genre = url.searchParams.get("genre") || "";
        const { results } = await env.DB.prepare(
          "SELECT name FROM tags WHERE genre = ? ORDER BY name ASC"
        ).bind(genre).all();
        return withCors(jsonResponse(results.map((r) => r.name)));
      }

      if (path === "/api/tags" && request.method === "POST") {
        const body = await request.json();
        const name = (body.name || "").trim();
        const genre = (body.genre || "").trim();
        if (!name || !genre) return withCors(jsonResponse({ error: "name and genre required" }, 400));
        await env.DB.prepare("INSERT OR IGNORE INTO tags (name, genre) VALUES (?, ?)").bind(name, genre).run();
        return withCors(jsonResponse({ ok: true }));
      }

      if (path === "/api/tags" && request.method === "DELETE") {
        const genre = url.searchParams.get("genre") || "";
        const name = url.searchParams.get("name") || "";
        await env.DB.prepare("DELETE FROM tags WHERE genre = ? AND name = ?").bind(genre, name).run();
        return withCors(jsonResponse({ ok: true }));
      }

      if (path === "/api/tags" && request.method === "PUT") {
        const genre = url.searchParams.get("genre") || "";
        const name = url.searchParams.get("name") || "";
        const body = await request.json();
        const newName = (body.newName || "").trim();
        if (!newName) return withCors(jsonResponse({ error: "newName required" }, 400));
        await env.DB.prepare("UPDATE tags SET name = ? WHERE genre = ? AND name = ?").bind(newName, genre, name).run();
        return withCors(jsonResponse({ ok: true }));
      }

      // ---- メモ ----
      if (path === "/api/entries" && request.method === "GET") {
        const genre = url.searchParams.get("genre");
        let stmt;
        if (genre) {
          stmt = env.DB.prepare(
            "SELECT * FROM entries WHERE genre = ? ORDER BY created_at DESC"
          ).bind(genre);
        } else {
          stmt = env.DB.prepare("SELECT * FROM entries ORDER BY created_at DESC");
        }
        const { results } = await stmt.all();
        const parsed = results.map((r) => ({ ...r, tags: JSON.parse(r.tags || "[]") }));
        return withCors(jsonResponse(parsed));
      }

      if (path === "/api/entries" && request.method === "POST") {
        const body = await request.json();
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        await env.DB.prepare(
          "INSERT INTO entries (id, genre, memo, link, tags, created_at) VALUES (?,?,?,?,?,?)"
        ).bind(
          id,
          body.genre || "",
          body.memo || "",
          body.link || "",
          JSON.stringify(body.tags || []),
          createdAt
        ).run();
        return withCors(jsonResponse({ id, createdAt }));
      }

      if (path.startsWith("/api/entries/") && request.method === "PUT") {
        const id = path.split("/")[3];
        const body = await request.json();
        await env.DB.prepare(
          "UPDATE entries SET genre=?, memo=?, link=?, tags=? WHERE id=?"
        ).bind(
          body.genre || "",
          body.memo || "",
          body.link || "",
          JSON.stringify(body.tags || []),
          id
        ).run();
        return withCors(jsonResponse({ ok: true }));
      }

      if (path.startsWith("/api/entries/") && request.method === "DELETE") {
        const id = path.split("/")[3];
        await env.DB.prepare("DELETE FROM entries WHERE id=?").bind(id).run();
        return withCors(jsonResponse({ ok: true }));
      }

      return withCors(jsonResponse({ error: "not found" }, 404));
    } catch (err) {
      return withCors(jsonResponse({ error: err.message }, 500));
    }
  },
};
