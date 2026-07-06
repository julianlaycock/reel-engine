"""Grab license-clean background music from Jamendo for the rotation pool.

Music is the #1 Content-ID strike risk, so every track lands in public/audio/music/
with a provenance sidecar (<name>.json) the gate reads. We filter to CC-BY tracks
(commercial use OK *with attribution*) and store the required credit string.

  fill   — download N CC-BY instrumental beds into the rotation pool.
  get    — download one specific search result.

    python scripts/grab_music.py fill --tags "cinematic calm ambient" --n 6
    python scripts/grab_music.py get --tags "ambient piano" calm-01

Needs JAMENDO_CLIENT_ID in .env or env (free at https://devportal.jamendo.com/).
Show the credit (sidecar `attribution`) somewhere on the video or in the description.
"""
import argparse
import json
import os
import shutil
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path.cwd()
MUSIC_DIR = ROOT / "public" / "audio" / "music"
API = "https://api.jamendo.com/v3.0/tracks/"
UA = "vektor-engine/1.0"


def load_key():
    key = os.environ.get("JAMENDO_CLIENT_ID")
    if not key and (ROOT / ".env").exists():
        for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
            if line.startswith("JAMENDO_CLIENT_ID"):
                key = line.split("=", 1)[1].strip().strip('"').strip("'")
    if not key:
        sys.exit("ERROR: JAMENDO_CLIENT_ID not set. Free key: https://devportal.jamendo.com/")
    return key


def search(key, tags, limit):
    # fuzzytags = OR (broad); strict AND tags + duration over-filter and return nothing.
    qs = urllib.parse.urlencode({
        "client_id": key, "format": "json", "limit": max(limit, 40),
        "vocalinstrumental": "instrumental", "durationbetween": "45_240",
        "fuzzytags": "+".join(tags.split()),
        "order": "popularity_month", "include": "musicinfo licenses",
        "audioformat": "mp32",
    })
    req = urllib.request.Request(API + "?" + qs, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read()).get("results", [])


def is_commercial_cc(license_url: str) -> bool:
    """CC-BY / BY-SA / BY-ND allow commercial use; anything with 'nc' does not."""
    u = (license_url or "").lower()
    return "creativecommons.org/licenses/by" in u and "-nc" not in u and "/nc" not in u


def cc_tag(license_url: str) -> str:
    u = (license_url or "").lower()
    if "by-sa" in u:
        return "cc-by-sa"
    if "by-nd" in u:
        return "cc-by-nd"
    return "cc-by"


def download_track(t, name):
    url = t.get("audiodownload")
    if not (t.get("audiodownload_allowed") and url):
        return None
    MUSIC_DIR.mkdir(parents=True, exist_ok=True)
    dest = MUSIC_DIR / f"{name}.mp3"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as fh:
        fh.write(r.read())
    artist = t.get("artist_name", "unknown")
    lic = t.get("license_ccurl", "")
    sidecar = dest.with_suffix(".json")
    sidecar.write_text(json.dumps({
        "name": name,
        "track": t.get("name", ""),
        "artist": artist,
        "src_url": t.get("shareurl") or t.get("shorturl", ""),
        "source": f"Jamendo — {artist}",
        "license": cc_tag(lic),
        "license_url": lic,
        "attribution": f'"{t.get("name","")}" by {artist} (Jamendo, {cc_tag(lic).upper()})',
        "duration_s": t.get("duration"),
    }, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[ok] {dest.relative_to(ROOT)}  [{cc_tag(lic)}]  \"{t.get('name','')}\" — {artist}")
    return dest


def cmd_fill(args):
    key = load_key()
    results = [t for t in search(key, args.tags, args.n * 3) if is_commercial_cc(t.get("license_ccurl", ""))]
    if not results:
        sys.exit(f"No commercial-CC instrumental tracks for tags {args.tags!r}. Try other tags.")
    got = 0
    for i, t in enumerate(results):
        if got >= args.n:
            break
        if download_track(t, f"{args.prefix}{got+1:02d}"):
            got += 1
    print(f"\nFilled {got} track(s) into public/audio/music/. Run `rotate-music.mjs` per build.")


def cmd_get(args):
    key = load_key()
    results = [t for t in search(key, args.tags, 20) if is_commercial_cc(t.get("license_ccurl", ""))]
    if not results:
        sys.exit(f"No commercial-CC track for tags {args.tags!r}.")
    if not download_track(results[args.pick], args.name):
        sys.exit("Top pick had downloads disabled; try --pick 1.")


def cmd_register(args):
    # Add tracks YOU curated (Pixabay Music / YouTube Audio Library — free, better quality,
    # commercial-OK) to the rotation pool with provenance. Point at one .mp3 or a folder.
    src = Path(args.path)
    files = sorted(src.glob("*.mp3")) if src.is_dir() else [src]
    if not files or not files[0].exists():
        sys.exit(f"ERROR: no mp3 found at {args.path}")
    MUSIC_DIR.mkdir(parents=True, exist_ok=True)
    n = 0
    for f in files:
        name = "cur-" + f.stem.lower().replace(" ", "-").replace("_", "-")[:40]
        dest = MUSIC_DIR / f"{name}.mp3"
        shutil.copyfile(f, dest)
        dest.with_suffix(".json").write_text(json.dumps({
            "name": name, "track": f.stem, "source": args.source,
            "license": args.license, "credit": args.credit,
            "attribution": args.credit or (f"{f.stem} ({args.source})"),
        }, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"[ok] {dest.relative_to(ROOT)}  [{args.license}]  ({args.source})")
        n += 1
    print(f"\nRegistered {n} track(s) into the rotation pool. `rotate-music.mjs` will use them.")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)

    reg = sub.add_parser("register", help="add curated tracks (Pixabay/YT Audio Library) to the pool")
    reg.add_argument("path", help="an .mp3 file OR a folder of .mp3s to batch-register")
    reg.add_argument("--license", default="royalty-free", choices=["royalty-free", "cc-by", "cc-by-sa", "own", "licensed"])
    reg.add_argument("--source", default="Pixabay Music")
    reg.add_argument("--credit", default="", help="on-screen credit if the licence needs one (Pixabay: none)")
    reg.set_defaults(func=cmd_register)
    f = sub.add_parser("fill")
    f.add_argument("--tags", default="cinematic calm ambient")
    f.add_argument("--n", type=int, default=6)
    f.add_argument("--prefix", default="bed-")
    f.set_defaults(func=cmd_fill)
    g = sub.add_parser("get")
    g.add_argument("name")
    g.add_argument("--tags", default="cinematic calm")
    g.add_argument("--pick", type=int, default=0)
    g.set_defaults(func=cmd_get)
    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
