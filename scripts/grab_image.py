"""Grab a license-clean still IMAGE and register its provenance.

Match photos from wire agencies (Getty/AP/Reuters) are copyrighted — using them
raw carries the same strike risk as broadcast clips. This gives two safe paths,
both of which write a provenance sidecar (public/images/<name>.json) that the
footage-rights gate reads:

  wikimedia  — search Wikimedia Commons (free CC / public-domain), download the
               top hit, and auto-tag its license from Commons metadata.
  register   — register an image you LICENSED (e.g. a Getty editorial download)
               or shot yourself; copies it in and tags it (default `licensed`).

    python scripts/grab_image.py wikimedia "<query>" <name>
    python scripts/grab_image.py register <localfile> <name> --license licensed --source "<url>" --credit "Getty / John Doe"

License tags the gate accepts for images: licensed, stock, own, cc, public-domain,
transformative. Anything else (or no sidecar) blocks publish.

Wikimedia requires a descriptive User-Agent or it 403s.
"""
import argparse
import json
import shutil
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path.cwd()
IMG_DIR = ROOT / "public" / "images"
UA = "vektor-engine/1.0 (https://vektor.fm; contact julianlaycock94@gmail.com)"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"


def http_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as fh:
        fh.write(r.read())


def classify_license(short_name: str) -> str:
    s = (short_name or "").lower()
    if "public domain" in s or "pd" == s or s.startswith("cc0"):
        return "public-domain"
    if "cc" in s or "creative commons" in s:
        return "cc"
    return "licensed"  # on Commons but unusual tag — still free, treat as licensed


def write_sidecar(name, ext, meta):
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    sidecar = IMG_DIR / f"{name}.json"
    sidecar.write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[ok] {sidecar.relative_to(ROOT)}  [license={meta['license']}]")
    print(f"     reference it in video.json as  \"images/{name}.{ext}\"")


def cmd_wikimedia(args):
    q = urllib.parse.urlencode({
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": args.query, "gsrnamespace": "6", "gsrlimit": "5",
        "prop": "imageinfo", "iiprop": "url|extmetadata",
    })
    data = http_json(f"{COMMONS_API}?{q}")
    pages = list((data.get("query", {}).get("pages", {}) or {}).values())
    if not pages:
        sys.exit(f"ERROR: no Wikimedia Commons results for {args.query!r}")
    pages.sort(key=lambda p: p.get("index", 99))
    info = pages[args.pick].get("imageinfo", [{}])[0]
    url = info.get("url")
    if not url:
        sys.exit("ERROR: result has no downloadable image url")
    ext = url.rsplit(".", 1)[-1].lower().split("?")[0]
    if ext not in ("jpg", "jpeg", "png", "webp"):
        ext = "jpg"

    IMG_DIR.mkdir(parents=True, exist_ok=True)
    dest = IMG_DIR / f"{args.name}.{ext}"
    print(f"[dl] {pages[args.pick].get('title')}")
    download(url, dest)
    print(f"[ok] {dest.relative_to(ROOT)}")

    ext_meta = info.get("extmetadata", {})
    short = (ext_meta.get("LicenseShortName", {}) or {}).get("value", "")
    artist = (ext_meta.get("Artist", {}) or {}).get("value", "")
    license_tag = classify_license(short)
    write_sidecar(args.name, ext, {
        "name": args.name,
        "src_url": info.get("descriptionurl") or url,
        "source": f"Wikimedia Commons — {artist or 'unknown'}",
        "license": license_tag,
        "license_name": short,
        "query": args.query,
    })
    if license_tag == "cc":
        print("     note: CC images may require on-screen attribution — keep the credit handy.")


def cmd_register(args):
    local = Path(args.localfile)
    if not local.exists():
        sys.exit(f"ERROR: file not found: {local}")
    ext = local.suffix.lstrip(".").lower() or "jpg"
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    dest = IMG_DIR / f"{args.name}.{ext}"
    shutil.copyfile(local, dest)
    print(f"[ok] copied -> {dest.relative_to(ROOT)}")
    write_sidecar(args.name, ext, {
        "name": args.name,
        "src_url": args.source or "",
        "source": args.credit or args.source or "manually registered",
        "license": args.license,
        "credit": args.credit or "",
    })


OPENVERSE = "https://api.openverse.org/v1/images/"


def ov_tag(lic: str) -> str:
    l = (lic or "").lower()
    if l in ("cc0", "pdm"):
        return "public-domain"
    if l == "by":
        return "cc-by"
    if l == "by-sa":
        return "cc-by-sa"
    return "cc"  # by-nd etc. — fine to display an unmodified image


def cmd_openverse(args):
    # Free CC image search across Flickr/Wikimedia/museums (commercial-OK licences only).
    qs = urllib.parse.urlencode({
        "q": args.query, "license": "cc0,pdm,by,by-sa,by-nd",
        "page_size": 12, "mature": "false",
    })
    data = http_json(f"{OPENVERSE}?{qs}")
    results = data.get("results", [])
    if not results:
        sys.exit(f"ERROR: no commercial-CC Openverse results for {args.query!r}")
    if args.pick >= len(results):
        sys.exit(f"ERROR: --pick {args.pick} out of range ({len(results)} results)")
    r = results[args.pick]
    url = r.get("url") or r.get("thumbnail")
    if not url:
        sys.exit("ERROR: result has no image url")
    ext = url.rsplit(".", 1)[-1].lower().split("?")[0]
    if ext not in ("jpg", "jpeg", "png", "webp"):
        ext = "jpg"
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    dest = IMG_DIR / f"{args.name}.{ext}"
    print(f"[dl] {r.get('title', args.query)} — {r.get('source', '')}")
    download(url, dest)
    print(f"[ok] {dest.relative_to(ROOT)}")
    tag = ov_tag(r.get("license"))
    write_sidecar(args.name, ext, {
        "name": args.name,
        "src_url": r.get("foreign_landing_url") or url,
        "source": f"{r.get('source', 'Openverse')} — {r.get('creator', 'unknown')}",
        "license": tag,
        "license_name": f"CC {(r.get('license') or '').upper()} {r.get('license_version', '')}".strip(),
        "attribution": r.get("attribution", ""),
        "query": args.query,
    })
    if tag.startswith("cc-by"):
        print("     note: CC-BY* needs on-screen attribution — use the sidecar `attribution` / panel.badge.")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)

    o = sub.add_parser("openverse", help="search + download a free CC image (Flickr/Commons/museums)")
    o.add_argument("query")
    o.add_argument("name", help="output name (-> public/images/<name>.<ext>)")
    o.add_argument("--pick", type=int, default=0, help="which search result (0-based)")
    o.set_defaults(func=cmd_openverse)

    w = sub.add_parser("wikimedia", help="search + download a free Commons image")
    w.add_argument("query")
    w.add_argument("name", help="output name (-> public/images/<name>.<ext>)")
    w.add_argument("--pick", type=int, default=0, help="which search result (0-based)")
    w.set_defaults(func=cmd_wikimedia)

    r = sub.add_parser("register", help="register a licensed/own image with provenance")
    r.add_argument("localfile", help="path to the image you downloaded/shot")
    r.add_argument("name", help="output name (-> public/images/<name>.<ext>)")
    r.add_argument("--license", choices=["licensed", "stock", "own", "cc", "public-domain", "transformative"],
                   default="licensed")
    r.add_argument("--source", default=None, help="source URL (e.g. the Getty asset page)")
    r.add_argument("--credit", default=None, help="on-screen credit, e.g. 'Getty / Alex Grimm'")
    r.set_defaults(func=cmd_register)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
