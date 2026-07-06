"""Grab a hero clip and register its provenance (the footage side of the policy).

Two paths, both output a 9:16 clip at public/clips/<name>.mp4 plus a provenance
sidecar (public/clips/<name>.json) that the footage-rights gate reads:

  youtube   — download a YouTube URL with yt-dlp and crop it to vertical. Tag it
              `transformative` only when the footage sits UNDER your own analysis/VO
              with data overlays as the main event. Defaults to `broadcast-raw`
              (a publish BLOCKER — what got the Wimbledon cut struck).

  register  — Option D: you LICENSED a hero clip (Getty video / AP / Reuters /
              a news-clip licence) and downloaded the .mp4. This copies that local
              file in, crops to 9:16, and tags it `licensed` WITH the on-screen
              credit the licence requires. Use for hero moments ONLY (real match /
              interview action) — never as a substitute for stock B-roll.

    python scripts/grab_clip.py youtube  <url> <name> --license transformative --start 13 --dur 13
    python scripts/grab_clip.py register <localfile> <name> --credit "Getty / Alex Grimm" --source "<asset-url>"

License tags the gate accepts: transformative, licensed, stock, own. `broadcast-raw`
(or no sidecar) blocks publish. A `licensed`/`cc` clip carries a `credit` — SHOW it
on-screen (broll `label` lower-third, or the video `sourceLine`).
"""
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path.cwd()
CLIP_DIR = ROOT / "public" / "clips"

# License tags the footage-rights gate understands. Only `broadcast-raw` blocks publish.
LICENSES = ("transformative", "licensed", "stock", "own", "broadcast-raw")


def probe(path: Path, entry: str) -> int:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", f"stream={entry}", "-of", "default=nk=1:nw=1", str(path)],
        capture_output=True, text=True, check=True)
    return int(out.stdout.strip().splitlines()[0])


def crop_to_vertical(raw: Path, name: str, start: float, dur, cropx) -> Path:
    """Crop any source video to a centred 9:16 1080x1920/30fps clip."""
    h = probe(raw, "height")
    w = probe(raw, "width")
    cw = round(h * 9 / 16)                       # 9:16 crop width for this height
    x = cropx if cropx is not None else max(0, (w - cw) // 2)
    trim = f"trim={start}:{start + dur}," if dur else ""
    filt = (f"[0:v]{trim}setpts=PTS-STARTPTS,crop={cw}:{h}:{x}:0,"
            f"scale=1080:1920:flags=lanczos,fps=30[v]")
    out = CLIP_DIR / f"{name}.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    print(f"✂ cropping to 9:16 -> {out.relative_to(ROOT)}")
    subprocess.run(["ffmpeg", "-y", "-i", str(raw), "-filter_complex", filt,
                    "-map", "[v]", "-an", "-c:v", "libx264", "-crf", "20",
                    "-preset", "slow", "-pix_fmt", "yuv420p", str(out)], check=True)
    print(f"✓ {out.relative_to(ROOT)}")
    return out


def write_sidecar(out: Path, meta: dict):
    manifest = out.with_suffix(".json")
    manifest.write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"✓ {manifest.relative_to(ROOT)}  [license={meta['license']}]")
    if meta["license"] == "broadcast-raw":
        print("⚠ broadcast-raw: this will FAIL the footage-rights gate. Either run it "
              "UNDER your own VO/analysis with data overlays (then re-tag "
              "--license transformative) or swap to a licensed/stock/own source.")
    elif meta.get("credit"):
        print(f"     note: licence requires the credit on-screen — show \"{meta['credit']}\" "
              "in the broll `label` (lower-third) or the video `sourceLine`.")


def cmd_youtube(args):
    src_dir = ROOT / "tmp" / "src"
    src_dir.mkdir(parents=True, exist_ok=True)
    raw = src_dir / f"{args.name}_src.mp4"
    print(f"↓ downloading {args.url}")
    subprocess.run([sys.executable, "-m", "yt_dlp", "-f", "mp4/best",
                    "-o", str(raw), "--force-overwrites", args.url], check=True)
    out = crop_to_vertical(raw, args.name, args.start, args.dur, args.cropx)
    write_sidecar(out, {
        "name": args.name,
        "src_url": args.url,
        "source": args.source or args.url,
        "license": args.license,
        "credit": args.credit or "",
        "start": args.start,
        "dur": args.dur,
    })


def cmd_register(args):
    local = Path(args.localfile)
    if not local.exists():
        sys.exit(f"ERROR: file not found: {local}")
    out = crop_to_vertical(local, args.name, args.start, args.dur, args.cropx)
    write_sidecar(out, {
        "name": args.name,
        "src_url": args.source or "",
        "source": args.credit or args.source or "licensed hero footage",
        "license": args.license,
        "credit": args.credit or "",
        "start": args.start,
        "dur": args.dur,
    })


def main():
    ap = argparse.ArgumentParser(description="Grab/register a 9:16 hero clip with provenance.")
    sub = ap.add_subparsers(dest="cmd", required=True)

    y = sub.add_parser("youtube", help="download a YouTube URL and crop to 9:16")
    y.add_argument("url")
    y.add_argument("name", help="output clip name (-> public/clips/<name>.mp4)")
    y.add_argument("--license", choices=LICENSES, default="broadcast-raw",
                   help="provenance tag (gate reads this; broadcast-raw blocks publish)")
    y.add_argument("--source", default=None, help="human source note; defaults to the url")
    y.add_argument("--credit", default=None, help="on-screen credit if licence requires one")
    y.add_argument("--start", type=float, default=0.0)
    y.add_argument("--dur", type=float, default=None, help="seconds; omit for whole video")
    y.add_argument("--cropx", type=int, default=None, help="crop x offset; default = centre")
    y.set_defaults(func=cmd_youtube)

    r = sub.add_parser("register", help="Option D: register a LICENSED local video (Getty/AP/Reuters)")
    r.add_argument("localfile", help="path to the licensed .mp4 you downloaded")
    r.add_argument("name", help="output clip name (-> public/clips/<name>.mp4)")
    r.add_argument("--license", choices=["licensed", "own", "stock"], default="licensed",
                   help="default 'licensed' (you hold the rights)")
    r.add_argument("--source", default=None, help="the licence/asset page URL")
    r.add_argument("--credit", default=None, help="on-screen credit, e.g. 'Getty / Alex Grimm' (required by editorial licences)")
    r.add_argument("--start", type=float, default=0.0)
    r.add_argument("--dur", type=float, default=None, help="seconds; omit for whole clip")
    r.add_argument("--cropx", type=int, default=None, help="crop x offset; default = centre")
    r.set_defaults(func=cmd_register)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
