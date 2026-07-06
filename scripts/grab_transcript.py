"""Pull a YouTube video's transcript as REFERENCE for our own commentary.

This is the copyright-safe way to use punditry (e.g. a Henry breakdown that only
exists on video): we read the transcript to find angles and attributable quotes,
then write our OWN script over our OWN data. We never use their footage/audio, and
we never copy their wording — facts and ideas aren't copyrightable, expression is.

  search  — list candidate videos for a topic (yt-dlp), so you can pick good ones.
  get     — download one video's transcript to research/transcripts/<name>.md.

    python scripts/grab_transcript.py search "germany paraguay analysis" --n 8
    python scripts/grab_transcript.py get "https://www.youtube.com/watch?v=XXXX" germany-henry

Needs: youtube-transcript-api (pip install youtube-transcript-api) and yt-dlp.
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path.cwd()
OUT_DIR = ROOT / "research" / "transcripts"


def video_id(url: str) -> str:
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", url):
        return url
    m = re.search(r"(?:v=|youtu\.be/|/shorts/|/embed/)([A-Za-z0-9_-]{11})", url)
    if not m:
        sys.exit(f"ERROR: could not parse a video id from {url!r}")
    return m.group(1)


def fetch_meta(url: str) -> dict:
    """Title/channel via yt-dlp, for attribution. Best-effort."""
    try:
        out = subprocess.run(
            [sys.executable, "-m", "yt_dlp", "--dump-json", "--skip-download", "--no-warnings", url],
            capture_output=True, text=True, timeout=60)
        if out.returncode == 0:
            d = json.loads(out.stdout.splitlines()[0])
            return {"title": d.get("title", ""), "channel": d.get("uploader", ""), "date": d.get("upload_date", "")}
    except Exception:
        pass
    return {"title": "", "channel": "", "date": ""}


def get_transcript(vid: str):
    from youtube_transcript_api import YouTubeTranscriptApi
    # Handle both the classic static API and the 1.x instance API.
    if hasattr(YouTubeTranscriptApi, "get_transcript"):
        return YouTubeTranscriptApi.get_transcript(vid, languages=["en", "en-US", "en-GB"])
    api = YouTubeTranscriptApi()
    fetched = api.fetch(vid, languages=["en", "en-US", "en-GB"])
    return [{"text": s.text, "start": s.start, "duration": s.duration} for s in fetched]


def cmd_get(args):
    vid = video_id(args.url)
    meta = fetch_meta(args.url)
    try:
        segs = get_transcript(vid)
    except Exception as e:
        sys.exit(f"ERROR: no transcript for {vid} ({type(e).__name__}: {e}). "
                 "The video may have captions disabled.")

    text = " ".join(s["text"].replace("\n", " ") for s in segs).strip()
    text = re.sub(r"\s+", " ", text)
    words = len(text.split())

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    dest = OUT_DIR / f"{args.name}.md"
    header = (
        f"# Transcript (REFERENCE ONLY) — {args.name}\n\n"
        f"> ⚠️ RESEARCH REFERENCE. Do NOT copy wording verbatim and do NOT use the\n"
        f"> source's footage/audio. Use for angles + ATTRIBUTED quotes only\n"
        f"> (e.g. \"{meta['channel'] or 'the pundit'} said …\"). Our script is original, over our data.\n\n"
        f"- Source: {args.url}\n"
        f"- Title: {meta['title'] or '(unknown)'}\n"
        f"- Channel: {meta['channel'] or '(unknown)'}\n"
        f"- Uploaded: {meta['date'] or '(unknown)'}\n"
        f"- Words: {words}\n\n---\n\n"
    )
    dest.write_text(header + text + "\n", encoding="utf-8")
    print(f"[ok] {dest.relative_to(ROOT)}  ({words} words)")
    print(f"     {meta['title'] or vid}  —  {meta['channel'] or 'unknown channel'}")


def cmd_search(args):
    out = subprocess.run(
        [sys.executable, "-m", "yt_dlp", f"ytsearch{args.n}:{args.query}",
         "--dump-json", "--skip-download", "--flat-playlist", "--no-warnings"],
        capture_output=True, text=True, timeout=120)
    if out.returncode != 0:
        sys.exit(f"ERROR: yt-dlp search failed:\n{out.stderr[:400]}")
    print(f"Top {args.n} for {args.query!r}:\n")
    for line in out.stdout.splitlines():
        try:
            d = json.loads(line)
        except Exception:
            continue
        dur = d.get("duration")
        mins = f"{int(dur)//60}:{int(dur)%60:02d}" if dur else "?:??"
        print(f"  [{mins:>6}] {d.get('title','')[:70]}")
        print(f"           {d.get('channel') or d.get('uploader') or ''}  ·  https://youtu.be/{d.get('id')}")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    g = sub.add_parser("get", help="download one video's transcript")
    g.add_argument("url")
    g.add_argument("name", help="output name (-> research/transcripts/<name>.md)")
    g.set_defaults(func=cmd_get)
    s = sub.add_parser("search", help="list candidate videos for a topic")
    s.add_argument("query")
    s.add_argument("--n", type=int, default=8)
    s.set_defaults(func=cmd_search)
    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
