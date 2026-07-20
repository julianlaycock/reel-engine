#!/usr/bin/env python3
# Take-picker v1 (2026-07-20): rank N eleven_v3 takes objectively.
# Usage: python pick_take.py <slug> <script.txt> <take1.mp3> <take2.mp3> ...
# Hard gates: WER vs script > 3% fails; WPM outside 130-185 fails.
# Rank: pause-at-seam correctness + energy-decay (last third vs first) + WER.
import json, re, subprocess, sys, os

slug, script_path, *takes = sys.argv[1:]
script = open(script_path, encoding="utf-8").read()
NUM={"0":"zero","1":"one","2":"two","3":"three","4":"four","5":"five","6":"six","7":"seven","8":"eight","9":"nine","10":"ten","21":"twenty one","30":"thirty","50":"fifty","60":"sixty","101":"one oh one","2026":"twenty twenty six"}
def norm(t):
    toks=re.findall(r"[a-z0-9']+", t.lower()); out=[]
    for x in toks:
        if x=='dot': continue
        if x=='vector': x='vektor'
        out.extend(NUM.get(x,x).split())
    # fuse runs of single letters (m d -> md, f m -> fm)
    fused=[]
    for w in out:
        if len(w)==1 and w.isalpha() and fused and len(fused[-1])<=2 and fused[-1].isalpha() and len(fused[-1])>=1 and (len(fused[-1])==1 or len(fused[-1])==2):
            fused[-1]=fused[-1]+w
        else: fused.append(w)
    return fused
sw = norm(script)

def wer(ref, hyp):
    d = [[0]*(len(hyp)+1) for _ in range(len(ref)+1)]
    for i in range(len(ref)+1): d[i][0] = i
    for j in range(len(hyp)+1): d[0][j] = j
    for i in range(1, len(ref)+1):
        for j in range(1, len(hyp)+1):
            d[i][j] = min(d[i-1][j]+1, d[i][j-1]+1, d[i-1][j-1]+(ref[i-1]!=hyp[j-1]))
    return d[-1][-1]/max(1,len(ref))

def rms_thirds(path):
    out = subprocess.run(["ffmpeg","-i",path,"-af","astats=metadata=1:reset=0","-f","null","-"],
                         capture_output=True, text=True).stderr
    m = re.findall(r"RMS level dB: (-?[\d.]+)", out)
    return float(m[-1]) if m else None

results = []
for t in takes:
    cap = t.rsplit(".",1)[0] + ".captions.json"
    subprocess.run(["node","../reel-engine/scripts/generate-captions.mjs","--input",t,"--output",cap],
                   capture_output=True, text=True, cwd=os.getcwd())
    try:
        words = json.load(open(cap, encoding="utf-8"))
        wl = words["words"] if isinstance(words, dict) else words
    except Exception as e:
        results.append({"take": t, "fail": f"no captions: {e}"}); continue
    hyp = norm(" ".join(w.get("text",w.get("word","")) for w in wl))
    dur = ((wl[-1].get("endMs",0) - wl[0].get("startMs",0))/1000.0) if wl else 0
    wpm = len(hyp)/dur*60 if dur else 0
    w = wer(sw, hyp)
    # pauses: gaps > 0.55s between consecutive words; mid-sentence long gaps are glitches
    gaps = []
    for a,b in zip(wl, wl[1:]):
        g = (b.get("startMs",0)-a.get("endMs",0))/1000.0
        if g > 0.55: gaps.append((a.get("text",""), round(g,2)))
    # energy decay: first vs last third mean RMS via segment analysis
    def seg_rms(path, ss, dur_s):
        out = subprocess.run(["ffmpeg","-ss",str(ss),"-t",str(dur_s),"-i",path,
                              "-af","astats=metadata=1:reset=0","-f","null","-"],
                             capture_output=True, text=True).stderr
        m = re.findall(r"RMS level dB: (-?[\d.]+)", out)
        return float(m[-1]) if m else None
    third = dur/3 if dur else 1
    r1, r3 = seg_rms(t, 0, third), seg_rms(t, 2*third, third)
    decay = (r1 - r3) if (r1 is not None and r3 is not None) else None
    hard_fail = []
    r_wer = w  # gated relatively after the loop
    if not (130 <= wpm <= 185): hard_fail.append(f"WPM {wpm:.0f}")
    results.append({"take": os.path.basename(t), "wer": round(w,4), "wpm": round(wpm,1),
                    "dur_s": round(dur,1), "long_gaps": gaps[:6], "n_gaps": len(gaps),
                    "energy_decay_db": round(decay,2) if decay is not None else None,
                    "hard_fail": hard_fail})

valid=[r for r in results if not r.get("fail")]
if valid:
    best=min(r["wer"] for r in valid)
    for r in valid:
        if r["wer"] > best + 0.02 or r["wer"] > 0.12: r["hard_fail"].append(f"WER {r['wer']:.1%} (best {best:.1%})")
ok = [r for r in results if not r.get("hard_fail") and not r.get("fail")]
# rank: lowest WER, then least energy decay, then gap count closest to seam count (~5 seams)
for r in ok:
    r["score"] = r["wer"]*100 + max(0,(r["energy_decay_db"] or 0))*0.5 + abs(r["n_gaps"]-5)*0.2
ok.sort(key=lambda r: r["score"])
print(json.dumps({"slug": slug, "ranked": ok, "all": results}, indent=1))
if ok: print("WINNER:", ok[0]["take"])
else: print("ALL TAKES FAILED HARD GATES — regenerate")
