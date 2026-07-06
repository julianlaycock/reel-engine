"""Pull Polymarket (prediction-market) implied probabilities — the crowd's real money.

Feeds the third bar in our model-vs-bookies-vs-market comparison. Polymarket's
Gamma API is free and public (no key). Output is a provenance-stamped fact file
(research/markets/<name>.json) so the on-screen number is traceable per FACTS-POLICY.

  search  — find active markets matching a topic (politics/tech/sports/culture).
  get     — pull one market's outcomes + implied % to a fact file.

    python scripts/grab_polymarket.py search "world cup winner"
    python scripts/grab_polymarket.py get <market-slug> germany-wc --note "to win the World Cup"

Implied % from a prediction market is the mid-price (last/again raw) — it already
nets out to ~100% across outcomes; state it as "the market's price", not advice.
"""
import argparse
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path.cwd()
OUT_DIR = ROOT / "research" / "markets"
BASE = "https://gamma-api.polymarket.com"
UA = "vektor-engine/1.0"


def http_json(path, params):
    qs = urllib.parse.urlencode(params, doseq=True)
    req = urllib.request.Request(f"{BASE}{path}?{qs}", headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def parse_prices(market):
    """Return [(outcome, prob_pct)] from a market's outcomes/outcomePrices."""
    try:
        outs = json.loads(market.get("outcomes", "[]"))
        prices = json.loads(market.get("outcomePrices", "[]"))
        return [(o, round(float(p) * 100, 1)) for o, p in zip(outs, prices)]
    except Exception:
        return []


def cmd_search(args):
    # Fetch a batch of liquid active markets and filter client-side by query terms.
    markets = http_json("/markets", {
        "active": "true", "closed": "false", "archived": "false",
        "limit": 250, "order": "volumeNum", "ascending": "false",
    })
    terms = args.query.lower().split()
    hits = []
    for m in markets:
        q = (m.get("question", "") + " " + m.get("slug", "")).lower()
        if all(t in q for t in terms):
            hits.append(m)
    if not hits:
        sys.exit(f"No active markets matched {args.query!r} in the top liquid batch. "
                 "Try fewer/broader terms, or browse polymarket.com and use `get <slug>`.")
    print(f"Matches for {args.query!r}:\n")
    for m in hits[: args.n]:
        pr = parse_prices(m)
        prob = "  ".join(f"{o} {p}%" for o, p in pr[:4]) or "(no price)"
        vol = m.get("volumeNum") or m.get("volume") or 0
        print(f"  {m.get('question','')[:72]}")
        print(f"     slug={m.get('slug')}  vol=${float(vol):,.0f}")
        print(f"     {prob}\n")


def cmd_get(args):
    markets = http_json("/markets", {"slug": args.slug})
    if not markets:
        sys.exit(f"No market with slug {args.slug!r}. Use `search` to find the slug.")
    m = markets[0]
    prices = parse_prices(m)
    if not prices:
        sys.exit("Market found but no outcomePrices available (may be unresolved/illiquid).")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    dest = OUT_DIR / f"{args.name}.json"
    record = {
        "name": args.name,
        "source": "Polymarket (prediction market)",
        "src_url": f"https://polymarket.com/event/{m.get('slug')}",
        "question": m.get("question"),
        "note": args.note or "",
        "outcomes": [{"outcome": o, "implied_pct": p} for o, p in prices],
        "volume_usd": m.get("volumeNum") or m.get("volume"),
        "license": "data-fact",
    }
    dest.write_text(json.dumps(record, indent=2), encoding="utf-8")
    print(f"[ok] {dest.relative_to(ROOT)}")
    print(f"     {m.get('question')}")
    for o, p in prices:
        print(f"       {o}: {p}%")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("search")
    s.add_argument("query")
    s.add_argument("--n", type=int, default=10)
    s.set_defaults(func=cmd_search)
    g = sub.add_parser("get")
    g.add_argument("slug")
    g.add_argument("name", help="output name (-> research/markets/<name>.json)")
    g.add_argument("--note", default=None, help="human label, e.g. 'to win the World Cup'")
    g.set_defaults(func=cmd_get)
    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
