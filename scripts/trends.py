"""Daily trend-picker — surface ranked candidate topics for the day's pitch.

Free, no-key sources (resilient: each is best-effort, skips on failure):
  - Hacker News (Algolia front page)  → tech
  - Reddit hot (curated subs per domain)
  - Google News RSS (top stories)

Classifies each candidate into a Vektor domain (sports|politics|markets|tech|culture|
health-money), flags a likely *quantifiable angle* (the hard gate the pitch enforces),
scores by engagement, dedupes, and prints the top N. The pitch LLM then applies the
value bar + picks the method via pick-method.mjs. This is breadth+signal; the LLM judges.

    python scripts/trends.py [--n 12]

Note: not a substitute for judgment — TikTok/IG are closed, so do a manual Creative-Center
glance too. GDELT/Google-Trends velocity validation is a future add (see CONTENT-FACTORY.md).
"""
import argparse
import json
import re
import sys
import urllib.parse
import urllib.request
from html import unescape

UA = "vektor-trends/1.0 (+https://vektor.fm)"

# Google News topic feeds → domain (no key, domain-tagged, reliable).
GNEWS_TOPICS = {
    "BUSINESS": "markets", "SPORTS": "sports", "TECHNOLOGY": "tech",
    "ENTERTAINMENT": "culture", "HEALTH": "health-money", "NATION": "politics", "WORLD": "politics",
}
# Reddit hot would add engagement signal but now 403s unauthenticated (needs OAuth — future).
SUBS = {}
DOMAIN_KW = {
    "sports": ["nba","nfl","soccer","football","tennis","match","cup","league","playoff","odds","wins","beat","score","champion","f1","ufc","olympic"],
    "politics": ["election","poll","senate","president","vote","parliament","minister","congress","campaign","referendum","policy","tariff"],
    "markets": ["stock","market","price","shares","crypto","bitcoin","earnings","fed","inflation","ipo","nasdaq","yield","recession"],
    "tech": ["ai","model","gpt","openai","google","apple","chip","app","launch","startup","software","robot","llm","release"],
    "culture": ["movie","album","song","celebrity","show","netflix","box office","viral","award","oscar","streaming","trailer"],
    "health-money": ["salary","rent","cost","wage","health","diet","sleep","study finds","obesity","longevity","calories","pay"],
}
# Titles hinting at a number/competition/market/record → likely a quantifiable angle.
QUANT_KW = ["%","odds","poll","price","record","fastest","most","ranking","rank","number","stat","data","study","forecast","predict","wins","beat","vs","billion","million","rate","average","survey"]


def http(url, headers=None):
    req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()


def classify(title):
    t = title.lower()
    best, score = "general", 0
    for dom, kws in DOMAIN_KW.items():
        c = sum(1 for k in kws if k in t)
        if c > score:
            best, score = dom, c
    return best


def quantifiable(title):
    t = title.lower()
    return any(k in t for k in QUANT_KW)


def add(items, title, signal, source, domain=None):
    title = unescape(re.sub(r"\s+", " ", title)).strip()
    for a, b in (("’", "'"), ("‘", "'"), ("“", '"'), ("”", '"'), ("–", "-"), ("—", "-")):
        title = title.replace(a, b)
    if len(title) < 15:
        return
    items.append({"title": title, "signal": signal, "source": source,
                  "domain": domain or classify(title), "quant": quantifiable(title)})


def fetch_hn(items):
    try:
        d = json.loads(http("https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=20"))
        pts = [h.get("points", 0) for h in d["hits"]] or [1]
        mx = max(pts) or 1
        for h in d["hits"]:
            add(items, h.get("title", ""), round((h.get("points", 0) / mx), 2), "HN", "tech")
    except Exception as e:
        print(f"# HN skipped: {e}", file=sys.stderr)


def fetch_reddit(items):
    for dom, sub in SUBS.items():
        try:
            d = json.loads(http(f"https://www.reddit.com/r/{sub}/hot.json?limit=8"))
            kids = [c["data"] for c in d["data"]["children"] if not c["data"].get("stickied")]
            mx = max((k.get("score", 0) for k in kids), default=1) or 1
            for k in kids[:6]:
                add(items, k.get("title", ""), round(k.get("score", 0) / mx, 2), f"r/{sub}", dom)
        except Exception as e:
            print(f"# r/{sub} skipped: {e}", file=sys.stderr)


def fetch_gnews(items):
    # Top stories (domain auto-classified) + per-topic feeds (domain known from the feed).
    feeds = [("https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en", None)]
    for topic, dom in GNEWS_TOPICS.items():
        feeds.append((f"https://news.google.com/rss/headlines/section/topic/{topic}?hl=en-US&gl=US&ceid=US:en", dom))
    for url, dom in feeds:
        try:
            xml = http(url).decode("utf-8", "ignore")
            titles = re.findall(r"<item>.*?<title>(.*?)</title>", xml, re.S)[:8]
            # GNews appends " - Publisher" to titles; strip it.
            for t in titles:
                add(items, re.sub(r"\s+-\s+[^-]+$", "", t), 0.6, "GNews", dom)
        except Exception as e:
            print(f"# GNews {dom or 'top'} skipped: {e}", file=sys.stderr)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=12)
    args = ap.parse_args()

    items = []
    fetch_hn(items)
    fetch_reddit(items)
    fetch_gnews(items)
    if not items:
        sys.exit("No trend sources reachable. Try again, or pick a topic manually.")

    # dedupe near-identical titles (first 40 chars)
    seen, uniq = set(), []
    for it in sorted(items, key=lambda x: -x["signal"]):
        k = it["title"][:40].lower()
        if k in seen:
            continue
        seen.add(k)
        uniq.append(it)

    # rank: engagement signal, boosted if it has a quantifiable angle + a known domain
    for it in uniq:
        it["score"] = round(it["signal"] + (0.25 if it["quant"] else 0) + (0.15 if it["domain"] != "general" else 0), 2)
    uniq.sort(key=lambda x: -x["score"])

    print(f"# Top {args.n} trend candidates (score = engagement + quant-angle + domain-fit)")
    print("# The pitch applies the value bar: data-gate (must have a real number) + non-obvious take. [Q] = likely quantifiable.\n")
    for it in uniq[: args.n]:
        flag = "[Q]" if it["quant"] else "[ ]"
        print(f"{flag} [{it['score']:.2f}] ({it['domain']}/{it['source']}) {it['title'][:90]}")
    n_quant = sum(1 for it in uniq[: args.n] if it["quant"])
    print(f"\n# {n_quant}/{args.n} have a likely quantifiable angle. Pick 4 that pass the data-gate; "
          f"assign a fresh method with `node scripts/pick-method.mjs candidates --domain <d>`.")


if __name__ == "__main__":
    main()
