# Auto-publish — free, unified, approval-gated

**Goal:** you send a finished video on WhatsApp → I caption + QA it → schedule it to all platforms at a peak window → you tap ✅ → it posts. Free, via self-hosted **Postiz**.

## The flow (once set up)
1. **You** send the .mp4 on WhatsApp (any brand).
2. **I** pull it (`wa-read`), author the per-platform caption pack (`post.md`), run the QA gate (`qa-measure` / `qa-video`).
3. **I** create *scheduled* posts in Postiz for the next peak window (default **Tue–Thu 09:00–11:00** local) — YouTube, TikTok, Instagram Reels, X, LinkedIn — each with its platform-specific caption.
4. **I** WhatsApp you a one-line summary + "reply ✅ to publish / ✏️ to tweak / ❌ to cancel."
5. On **✅** the schedule stands (Postiz posts at the window). On ❌ I delete the scheduled posts.

Nothing goes public without your ✅.

## One-time setup (only you can do this — your accounts)

### 1. Run Postiz (free, self-hosted)
Postiz isn't a single container — it needs Postgres + Redis (+ a Temporal stack). Use the **official compose** (AGPL-3.0). One command to bring it all up:
```bash
git clone https://github.com/gitroomhq/postiz-docker-compose
cd postiz-docker-compose
# edit docker-compose.yaml → set JWT_SECRET to any random string.
# (MAIN_URL/FRONTEND_URL/NEXT_PUBLIC_BACKEND_URL default to http://localhost:4007 — fine for local.
#  If hosting on a domain/VPS, set all three to https://your-domain.)
docker compose up -d
```
Then open **http://localhost:4007** and create your account. (Needs Docker + ~2–3 GB free RAM for the stack; the heaviest piece is the Temporal/Elasticsearch part.)

### 2. Connect each social account (in Postiz → Settings → Channels)
Each platform needs *your* developer app + OAuth once. Notes:
- **YouTube** — Google Cloud project + OAuth; full auto-upload. Easiest win.
- **X / Twitter** — X developer app (free tier posts; low limits).
- **LinkedIn** — LinkedIn app (Community Management / "Share on LinkedIn" product).
- **Instagram Reels** — needs an IG **Business/Creator** account linked to a Facebook Page + a Meta app.
- **TikTok** — TikTok developer app. **Direct public posting needs TikTok's content-posting audit** (can take weeks); until approved it posts as a **draft** you finish in the app.

### 3. Give me access (pick one)
- **API:** Postiz → Settings → Public API → copy the key. Add to the app's `.env`:
  `POSTIZ_URL=http://localhost:5000` and `POSTIZ_API_KEY=...`  → I use `scripts/publish.mjs`.
- **MCP (nicer):** enable Postiz's MCP server and add it to your Claude MCP config → I publish by "chatting" to it, no custom client. (Mixpost also ships an MCP server if you prefer it.)

### 4. Tell me you're ready
I'll then: finish/verify `scripts/publish.mjs` against your live instance, and **enable the "publish watcher" cron** (hourly during business hours) that checks WhatsApp for new videos + your ✅ and drives steps 2–5 unattended.

## Compliance (don't skip)
Toggle each platform's **"AI-generated / altered content"** label on publish — the EU AI Act makes a persistent label mandatory from **2026-08-02**. Postiz posts it; the label toggle is per-platform.

## Status (2026-07-02)
- ✅ Generation crons (pitch/watcher/newsletter) **paused** — you supply videos now.
- ▶️ **Publishing = MANUAL for now** (chosen): I deliver the video + per-platform captions to WhatsApp; you upload natively (and toggle the AI-content label). No auto-publish dependency.
- ↩️ Self-hosted Postiz was trialled and **torn down** (`docker compose down` — the connect flow needs a developer app per platform + a public HTTPS callback; too much setup). Compose kept at `C:\Users\julia\postiz` if revisited.
- 💡 **When you want auto-publish with near-zero setup:** use a *managed free tier* instead of self-host — **[Upload-Post](https://www.upload-post.com/)** ($0 / ~10 uploads-mo, **no developer apps**, click-connect accounts, has an API). Then I wire `publish.mjs` + the approval-gated watcher to it.
