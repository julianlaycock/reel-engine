"""Grab a license-clean stock B-roll clip from Pexels and crop it to 9:16.

Pexels footage is free to use (Pexels License: no attribution required, fine for
commercial/social). This is the SAFE footage path — clips land tagged
`license: stock`, which passes the QA footage gate, unlike raw broadcast.

    python scripts/grab_pexels.py "<search query>" <name> [--pick N] [--start S] [--dur D]

Example (tennis crowd for the Wimbledon hook):
    python scripts/grab_pexels.py "tennis serve" wimb-hook --dur 6.5

Needs PEXELS_API_KEY in .env (engine root) or the environment.
Get a free key instantly at https://www.pexels.com/api/.
"""
import argparse
import json
import os
import subprocess
import sys
import urllib.request
import urllib.parse
from pathlib import Path

ROOT = Path.cwd()
UA = "vektor-engine/1.0"  # Pexels 403s the default python-urllib User-Agent


def load_key() -> str:
    key = os.environ.get("PEXELS_API_KEY")
    if not key:
        env = ROOT / ".env"
        if env.exists():
            for line in env.read_text(encoding="utf-8").splitlines():
                if line.startswith("PEXELS_API_KEY"):
                    key = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    if not key:
        sys.exit("ERROR: PEXELS_API_KEY not set. Add it to .env or env. "
                 "Free key: https://www.pexels.com/api/")
    return key


def search(query: str, key: str, orientation: str = "portrait", per_page: int = 15):
    qs = urllib.parse.urlencode({
        "query": query, "orientation": orientation,
        "per_page": per_page, "size": "medium",
    })
    req = urllib.request.Request(
        f"https://api.pexels.com/videos/search?{qs}",
        headers={"Authorization": key, "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["videos"]


def best_file(video: dict) -> dict:
    """Prefer the tallest <=1920 HD .mp4 file."""
    files = [f for f in video["video_files"] if f.get("file_type") == "video/mp4"]
    files.sort(key=lambda f: (f.get("height") or 0))
    pick = next((f for f in files if (f.get("height") or 0) >= 1280), None)
    return pick or (files[-1] if files else None)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("query")
    ap.add_argument("name", help="output clip name (-> public/clips/<name>.mp4)")
    ap.add_argument("--pick", type=int, default=0, help="which search result (0-based)")
    ap.add_argument("--min-dur", type=float, default=0.0,
                    help="skip results shorter than this many seconds (avoids freeze on long beats)")
    ap.add_argument("--start", type=float, default=0.0)
    ap.add_argument("--dur", type=float, default=None, help="seconds; omit for whole clip")
    ap.add_argument("--cropx", type=int, default=None, help="crop x offset; default = centre")
    args = ap.parse_args()

    key = load_key()
    print(f"[search] searching Pexels: {args.query!r}")
    videos = search(args.query, key)
    if not videos:
        sys.exit(f"ERROR: no Pexels results for {args.query!r}")
    if args.min_dur:
        long_enough = [v for v in videos if (v.get("duration") or 0) >= args.min_dur]
        if not long_enough:
            longest = max(videos, key=lambda v: v.get("duration") or 0)
            sys.exit(f"ERROR: no result >= {args.min_dur}s for {args.query!r} "
                     f"(longest was {longest.get('duration')}s). Try another query.")
        videos = long_enough
    if args.pick >= len(videos):
        sys.exit(f"ERROR: --pick {args.pick} out of range (got {len(videos)} results)")
    video = videos[args.pick]
    print(f"[pick] pexels #{video['id']}  duration={video.get('duration')}s")
    vfile = best_file(video)
    if not vfile:
        sys.exit("ERROR: no usable mp4 in that result")

    src_dir = ROOT / "tmp" / "src"
    src_dir.mkdir(parents=True, exist_ok=True)
    raw = src_dir / f"{args.name}_src.mp4"
    print(f"[dl] downloading pexels #{video['id']} ({vfile.get('width')}x{vfile.get('height')})")
    dreq = urllib.request.Request(vfile["link"], headers={"User-Agent": UA})
    with urllib.request.urlopen(dreq, timeout=120) as r, open(raw, "wb") as fh:
        fh.write(r.read())

    w, h = vfile["width"], vfile["height"]
    cw = round(h * 9 / 16)
    x = args.cropx if args.cropx is not None else max(0, (w - cw) // 2)
    trim = f"trim={args.start}:{args.start + args.dur}," if args.dur else ""
    filt = (f"[0:v]{trim}setpts=PTS-STARTPTS,crop={min(cw, w)}:{h}:{x}:0,"
            f"scale=1080:1920:flags=lanczos,fps=30[v]")
    out = ROOT / "public" / "clips" / f"{args.name}.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)

    print(f"[crop] cropping to 9:16 -> {out.relative_to(ROOT)}")
    subprocess.run(["ffmpeg", "-y", "-i", str(raw), "-filter_complex", filt,
                    "-map", "[v]", "-an", "-c:v", "libx264", "-crf", "20",
                    "-preset", "slow", "-pix_fmt", "yuv420p", str(out)], check=True)

    manifest = out.with_suffix(".json")
    manifest.write_text(json.dumps({
        "name": args.name,
        "src_url": video.get("url", ""),
        "source": f"Pexels — {video.get('user', {}).get('name', 'unknown')}",
        "license": "stock",
        "pexels_id": video["id"],
        "query": args.query,
        "start": args.start,
        "dur": args.dur,
    }, indent=2), encoding="utf-8")
    print(f"[ok] {out.relative_to(ROOT)}")
    print(f"[ok] {manifest.relative_to(ROOT)}  [license=stock]")


if __name__ == "__main__":
    main()
