import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CaptionWord} from './video-schema';
import {COLORS, FONTS} from '@tokens/tokens';

type Line = {
  startMs: number;
  endMs: number;
  words: CaptionWord[];
};

const MAX_CHARS = 22; // per displayed line — keeps it sound-off readable
const GAP_BREAK_MS = 550; // a pause this long starts a new line

// Group word timings into short rolling lines (TikTok/Shorts grammar).
const groupLines = (words: CaptionWord[]): Line[] => {
  const lines: Line[] = [];
  let current: CaptionWord[] = [];
  let chars = 0;

  const flush = () => {
    if (current.length === 0) return;
    lines.push({
      startMs: current[0].startMs,
      endMs: current[current.length - 1].endMs,
      words: current,
    });
    current = [];
    chars = 0;
  };

  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    const prev = words[i - 1];
    const gap = prev ? word.startMs - prev.endMs : 0;
    const wouldOverflow = chars + word.text.length + 1 > MAX_CHARS;

    if (current.length > 0 && (wouldOverflow || gap > GAP_BREAK_MS)) {
      flush();
    }

    current.push(word);
    chars += word.text.length + 1;
  }
  flush();
  return lines;
};

// ===== Vektor "keyword" caption style =====
// Punchy 2-word call-outs synced to narration (not a full karaoke transcript):
// numbers / %, ×, $ and the longest word in each chunk get the brand accent.
type Chunk = {startMs: number; holdEnd: number; words: string[]; keyIndex: number};

const isPunct = (t: string) => /^[\W_]+$/.test(t.trim());
const isStat = (t: string) => /[0-9$%×€£]/.test(t);

const groupKeyword = (words: CaptionWord[]): Chunk[] => {
  const clean = words.filter((w) => w.text && !isPunct(w.text));
  const raw: {startMs: number; endMs: number; words: string[]}[] = [];
  let cur: CaptionWord[] = [];
  const flush = () => {
    if (!cur.length) return;
    raw.push({
      startMs: cur[0].startMs,
      endMs: cur[cur.length - 1].endMs,
      words: cur.map((w) => w.text.trim()),
    });
    cur = [];
  };
  for (let i = 0; i < clean.length; i += 1) {
    const w = clean[i];
    const prev = clean[i - 1];
    const gap = prev ? w.startMs - prev.endMs : 0;
    // 2 words per chunk, or break early on a real pause
    if (cur.length >= 2 || (cur.length >= 1 && gap > 380)) flush();
    cur.push(w);
  }
  flush();

  return raw.map((c, i) => {
    // pick the "key" word: a stat token, else the longest
    let keyIndex = 0;
    let best = -1;
    c.words.forEach((t, j) => {
      const score = (isStat(t) ? 100 : 0) + t.replace(/[\W_]/g, '').length;
      if (score > best) {
        best = score;
        keyIndex = j;
      }
    });
    const holdEnd = i < raw.length - 1 ? raw[i + 1].startMs : c.endMs + 500;
    return {startMs: c.startMs, holdEnd, words: c.words, keyIndex};
  });
};

const KeywordCaptions: React.FC<{words: CaptionWord[]}> = ({words}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const chunks = useMemo(() => groupKeyword(words), [words]);
  const ms = (frame / fps) * 1000;

  let active: Chunk | undefined;
  for (const c of chunks) {
    if (ms >= c.startMs - 110 && ms <= c.holdEnd - 40) {
      active = c;
      break;
    }
  }
  if (!active) return null;

  const local = ms - active.startMs;
  const s = spring({frame: (local / 1000) * fps, fps, config: {damping: 18, stiffness: 170, mass: 0.5}, durationInFrames: 10});
  const scale = interpolate(s, [0, 1], [0.82, 1]);
  const opacity = interpolate(local, [-110, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '34%', pointerEvents: 'none'}}>
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          display: 'inline-flex',
          gap: '0.3em',
          alignItems: 'baseline',
          padding: '12px 24px',
          borderRadius: 14,
          background: 'rgba(0,0,0,0.42)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          fontFamily: FONTS.label,
          fontWeight: 800,
          fontSize: 78,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
          maxWidth: '90%',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {active.words.map((w, i) => (
          <span key={i} style={{color: i === active!.keyIndex ? 'var(--accent)' : COLORS.white}}>
            {w}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC<{
  words: CaptionWord[];
  style?: 'tiktok' | 'minimal' | 'keyword';
}> = ({words, style = 'tiktok'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (style === 'keyword') return <KeywordCaptions words={words} />;

  const lines = groupLines(words);
  const ms = (frame / fps) * 1000;

  let active: Line | undefined;
  for (const line of lines) {
    if (ms >= line.startMs - 120 && ms <= line.endMs + 160) {
      active = line;
      break;
    }
  }
  if (!active) return null;

  const enter = interpolate(ms, [active.startMs - 120, active.startMs + 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div className={`caps caps-${style}`} style={{opacity: enter}}>
      <div className="caps-box" style={{transform: `translateY(${(1 - enter) * 14}px)`}}>
        {active.words.map((word, i) => {
          const isActive = ms >= word.startMs && ms <= word.endMs + 40;
          const isPast = ms > word.endMs + 40;
          return (
            <span
              key={`${word.text}-${i}`}
              className={`caps-word${isActive ? ' caps-active' : ''}`}
              style={{opacity: isActive || isPast ? 1 : 0.55}}
            >
              {word.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
