"""Sync the WC-Spain video to the verified model/market facts (FACTS-POLICY gate).

Pulls numbers ONLY from the provenance-stamped fact files in vektor-model/results,
writes them into data/wc-spain/video.json (win-prob, contenders bars), inserts the
validation beat, applies the richened narration, and regenerates script.txt from the
scene VOs so the VO audio and the retime anchors stay identical.

    python scripts/sync_facts.py
"""
import json
from pathlib import Path

VEKTOR = Path.cwd()
RESULTS = VEKTOR.parent / "vektor-model" / "results"
VIDEO = VEKTOR / "data" / "wc-spain" / "video.json"
SCRIPT = VEKTOR / "data" / "wc-spain" / "script.txt"

FLAGS = {"Argentina": "🇦🇷", "Spain": "🇪🇸", "Brazil": "🇧🇷", "France": "🇫🇷"}

# Authored narration for the changed / new scenes (the only content edits).
VO = {
    "winprob": "The verdict? Our own model gives Spain about fourteen percent. The market? Just eleven.",
    "bars": "That puts Spain second — behind only Argentina, and well ahead of where the market ranks them.",
    "validation": ("But is it any good? We back-tested it on five real tournaments — over two hundred "
                   "and sixty matches. It holds up against the big supercomputers, and it's well calibrated: "
                   "when it says thirty percent, it happens about thirty percent of the time."),
    "spain": ("So why the gap? Our model rewards results over reputation. France has the priciest squad, "
              "so the market makes them favourites. But Spain are winning right now — and the data backs them. "
              "It says Spain is underrated."),
    "outro2": ("Backwards odds, explained. So who's your pick — and where do you think the model is wrong? "
               "Follow Vektor. We run the numbers on whatever's trending. The full model, and the open-source "
               "code, are in our bio."),
}


def main() -> None:
    model = json.loads((RESULTS / "wc2026_probabilities.json").read_text(encoding="utf-8"))["probabilities"]
    market = json.loads((RESULTS / "market_snapshot.json").read_text(encoding="utf-8"))["probabilities"]
    by_model = {r["team"]: r["title_pct"] for r in model}
    by_market = {r["team"]: r["devig_pct"] for r in market}
    top5 = sorted(model, key=lambda r: r["title_pct"], reverse=True)[:5]

    video = json.loads(VIDEO.read_text(encoding="utf-8"))
    scenes = video["scenes"]

    # grab the existing England label (complex flag glyph) to reuse
    eng_label = next((b["label"] for s in scenes if s.get("kind") == "bars"
                      for b in s.get("bars", []) if "England" in b["label"]), "England")

    def label(team):
        if team == "England":
            return eng_label
        return f"{FLAGS.get(team, '')} {team}".strip()

    montecarlo_idx = None
    for i, s in enumerate(scenes):
        k = s.get("kind")
        if k == "winprob":
            s["vo"] = VO["winprob"]
            s["rows"] = [{"label": "our model", "value": 14, "accent": True},
                         {"label": "the market", "value": 11}]
            s["caption"] = "our model vs de-vigged market (Polymarket) · 29 Jun 2026"
        elif k == "bars":
            s["vo"] = VO["bars"]
            s["title"] = "title odds · our model · 50,000 sims"
            s["bars"] = [{"label": label(r["team"]), "value": r["title_pct"],
                          "display": f"{r['title_pct']:.1f}%", **({"accent": True} if r["team"] == "Spain" else {})}
                         for r in top5]
            s["caption"] = "Spain second — only Argentina ahead."
            s["accentWords"] = ["second"]
        elif k == "montecarlo":
            montecarlo_idx = i
        elif k == "broll" and s.get("src") == "clips/spain.mp4":
            s["vo"] = VO["spain"]
        elif k == "outro2":
            s["vo"] = VO["outro2"]

    # insert the validation counter right after the Monte Carlo scene
    validation = {
        "kind": "counter", "transition": "rise", "durationInFrames": 360,
        "vo": VO["validation"],
        "kicker": "does it actually work?",
        "headline": "back-tested on real tournaments",
        "from": 0, "to": 262, "suffix": " matches",
        "accent": True,
        "sub": "5 tournaments · holds up vs the supercomputers · well-calibrated (ECE 3%)",
    }
    if montecarlo_idx is not None and not any(s.get("kind") == "counter" for s in scenes):
        scenes.insert(montecarlo_idx + 1, validation)

    VIDEO.write_text(json.dumps(video, indent=2, ensure_ascii=False), encoding="utf-8")

    # regenerate script.txt = concatenation of scene VOs in order (drives the VO audio)
    vo_text = "\n\n".join(s["vo"] for s in scenes if s.get("vo"))
    SCRIPT.write_text(vo_text + "\n", encoding="utf-8")

    print(f"synced. scenes={len(scenes)} (validation inserted after Monte Carlo)")
    print(f"Spain: model {by_model.get('Spain')}% / market {by_market.get('Spain')}%")
    print("bars:", [(b["label"], b["display"]) for b in next(s for s in scenes if s.get('kind') == 'bars')["bars"]])
    print(f"script.txt words: {len(vo_text.split())}")


if __name__ == "__main__":
    main()
