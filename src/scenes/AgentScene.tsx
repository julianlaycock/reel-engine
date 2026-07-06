import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import type {AgentScene as AgentSceneType} from '../video-schema';
import {fadeRise} from '../animation';
import {Chrome} from './Chrome';
import '../style.css';

// Parse a message into tokens with light inline styling: **bold** and `code`.
// Author bold/code as single tokens so word-by-word typing stays clean.
type Tok = {text: string; kind: 'plain' | 'bold' | 'code'};
const tokenize = (s: string): Tok[] =>
  s.split(/\s+/).filter(Boolean).map((w) => {
    if (w.startsWith('**') && w.endsWith('**')) return {text: w.slice(2, -2), kind: 'bold'};
    if (w.startsWith('`') && w.endsWith('`')) return {text: w.slice(1, -1), kind: 'code'};
    return {text: w, kind: 'plain'};
  });

const stateLabel: Record<string, string> = {clear: '● clear', flag: '● flag', pass: '● pass', valid: '✓ valid'};

export const AgentScene: React.FC<{scene: AgentSceneType; hideChrome?: boolean}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const blink = frame % 34 < 18 ? 1 : 0;

  const toks = tokenize(scene.typed);
  const TYPE_START = 14;
  const PER = 2.4; // frames per word
  const shown = Math.max(0, Math.floor((frame - TYPE_START) / PER));
  const typingDone = shown >= toks.length;
  const typeEnd = TYPE_START + toks.length * PER;

  const progStart = typeEnd + 10;
  const progP = interpolate(frame, [progStart, progStart + 28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const progVal = scene.progress ? Math.round(progP * scene.progress.value) : 0;

  const checksStart = progStart + (scene.progress ? 40 : 6);
  const replyStart = checksStart + (scene.checks?.length ?? 0) * 12 + 14;

  return (
    <AbsoluteFill>
      <div className="frame">
        {hideChrome ? null : <Chrome kicker={scene.kicker} kickerRight={scene.kickerRight} footerRight={scene.footerRight} />}

        <div className="ag-stage">
          {scene.eyebrow ? (
            <div className="ag-eyebrow" style={fadeRise(frame, 2, 12)}>
              {scene.eyebrow}
            </div>
          ) : null}

          <div className="ag-console" style={fadeRise(frame, 6, 16)}>
            <div className="ag-head">
              <span className="ag-dot" style={{opacity: interpolate(Math.sin(frame * 0.18), [-1, 1], [0.35, 1])}} />
              <span className="ag-title">{scene.consoleTitle ?? 'filing automation'}</span>
              <span className="ag-status">{scene.consoleStatus ?? 'active'}</span>
            </div>
            <div className="ag-body">
              {/* bot message types out word-by-word with a live cursor */}
              <div className="ag-bubble bot">
                {toks.slice(0, shown).map((t, i) => (
                  <span key={i} className={t.kind === 'code' ? 'ag-code' : t.kind === 'bold' ? 'ag-strong' : undefined}>
                    {t.text}
                    {i < shown - 1 ? ' ' : ''}
                  </span>
                ))}
                {!typingDone ? <span className="ag-caret" style={{opacity: blink}} /> : null}
              </div>

              {scene.progress ? (
                <div className="ag-progress" style={fadeRise(frame, progStart, 10)}>
                  <div className="ag-prog-top">
                    <span className="ag-prog-label">{scene.progress.label}</span>
                    <span className="ag-prog-val">
                      {progVal}<span className="ag-prog-total"> / {scene.progress.total}</span>
                    </span>
                  </div>
                  <div className="ag-track">
                    <div className="ag-fill" style={{width: `${(progP * scene.progress.value) / scene.progress.total * 100}%`}} />
                  </div>
                </div>
              ) : null}

              {(scene.checks ?? []).map((c, i) => (
                <div key={i} className="ag-check" style={fadeRise(frame, checksStart + i * 12, 10)}>
                  <span className="ag-check-label">{c.label}</span>
                  <span className={`ag-check-state s-${c.state}`}>{stateLabel[c.state]}</span>
                </div>
              ))}

              {scene.reply ? (
                <div className="ag-bubble user" style={fadeRise(frame, replyStart, 12)}>
                  {scene.reply}
                </div>
              ) : null}
            </div>
          </div>

          {scene.caption ? (
            <div className="ag-caption" style={fadeRise(frame, replyStart + 16, 14)}>
              {scene.caption}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
