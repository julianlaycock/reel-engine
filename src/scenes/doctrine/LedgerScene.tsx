import React from 'react';
import {interp, easeOutExpo, easePhysical} from '../../motion';
import {hexLerp} from '../../palettes';
import {FF, MONO, scr} from './kinetics';
import {computeWrap, ebStyle} from './wrap';
import type {SceneProps} from './types';
import type {LedgerRow} from '../../doctrine-schema';

// Renders a caption with the ONE *asterisk-wrapped* term in the accent color.
const AccentCaption: React.FC<{text: string; cac: string}> = ({text, cac}) => (
  <>
    {text.split('*').map((seg, i) => (i % 2 === 1 ? <span key={i} style={{color: cac}}>{seg}</span> : <span key={i}>{seg}</span>))}
  </>
);

// S3 — the proof chain. Rows scramble→resolve L→R, a resolve micro-pulse flashes
// each hash toward accent, the sealed row gets an accent left-border + ✓ pop.
// Verbatim from the reference ledger block (row k → st = 320 + k*16).
export const LedgerScene: React.FC<SceneProps> = ({frame, win, colors, section}) => {
  const {cfg, cac, cmu, chr, panelBg} = colors;
  const s0 = win.opIn[0];
  const rows: LedgerRow[] = section.viz?.rows ?? [];
  const caption = section.copy?.caption ?? '';
  return (
    <div style={computeWrap(frame, win)}>
      {section.eyebrow ? <div style={ebStyle(colors)}>{section.eyebrow}</div> : null}
      <div style={{position: 'absolute', left: '96px', right: '96px', top: '520px', height: '600px', background: panelBg, border: `1px solid ${chr}`, borderRadius: '3px', boxShadow: '0 1px 2px rgba(0,0,0,0.04),0 10px 26px rgba(0,0,0,0.06),0 28px 56px rgba(0,0,0,0.05)'}}>
        <div style={{position: 'absolute', left: '21px', top: '75px', width: '2px', height: '450px', background: cac, opacity: 0.5, transform: `scaleY(${interp(frame, [s0 + 4, s0 + 62], [0, 1], easeOutExpo).toFixed(3)})`, transformOrigin: 'top'}} />
        {rows.map((r, k) => {
          const st = s0 - 2 + k * 16;
          const op = interp(frame, [st, st + 8], [0, 1]);
          const ty = interp(frame, [st, st + 16], [16, 0], easeOutExpo);
          const prog = interp(frame, [st + 8, st + 26], [0, 1]);
          const rp = Math.max(0, 1 - Math.abs(frame - (st + 27)) / 6);
          const rowStyle: React.CSSProperties = {
            position: 'absolute', left: 0, right: 0, top: `${k * 150}px`, height: '150px', display: 'flex', alignItems: 'center', padding: '0 30px 0 44px', boxSizing: 'border-box', opacity: op, transform: `translateY(${ty.toFixed(1)}px)`,
            borderBottom: k < 3 ? `1px solid ${hexLerp(chr, cac, rp * 0.55)}` : 'none',
          };
          if (r.seal) {
            rowStyle.borderLeft = `3px solid ${cac}`;
            rowStyle.background = `color-mix(in srgb, ${cac} 8%, transparent)`;
          }
          const showVer = r.seal && frame > st + 16;
          return (
            <div key={k} style={rowStyle}>
              <div style={{flex: '0 0 72px', textAlign: 'center', fontFamily: MONO, fontSize: '30px', fontWeight: 500, letterSpacing: '0.08em', color: cmu}}>{r.i}</div>
              <div style={{flex: '0 0 1px', width: '1px', height: '74px', background: chr}} />
              <div style={{flex: '1 1 auto', paddingLeft: '30px', minWidth: 0}}>
                <div style={{fontFamily: FF, fontSize: '40px', fontWeight: 600, letterSpacing: '-0.01em', color: r.seal ? cac : cfg, lineHeight: 1.1, whiteSpace: 'nowrap'}}>{r.label}</div>
                <div style={{fontFamily: MONO, fontSize: '21px', color: cmu, letterSpacing: '0.04em', marginTop: '9px'}}>{r.meta}</div>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', gap: '6px'}}>
                {r.prevHash !== '' ? <div style={{fontFamily: MONO, fontSize: '19px', color: cmu, opacity: 0.55, letterSpacing: '0.03em'}}>{r.prevHash}</div> : null}
                <div style={{fontFamily: MONO, fontSize: '24px', color: r.seal ? cac : hexLerp(cmu, cac, rp * 0.85), letterSpacing: '0.04em', fontWeight: r.seal ? 500 : 400, transform: `scale(${(1 + rp * 0.05).toFixed(3)})`, transformOrigin: 'right center'}}>{scr(r.hash, prog, frame)}</div>
                {showVer ? <div style={{fontFamily: MONO, fontSize: '19px', color: cac, letterSpacing: '0.1em', opacity: interp(frame, [st + 16, st + 30], [0, 1], easeOutExpo), transform: `scale(${interp(frame, [st + 16, st + 32], [0.82, 1], easePhysical).toFixed(3)})`, transformOrigin: 'right center'}}>✓ verified · sealed</div> : null}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', top: '1360px', left: '96px', right: '96px', textAlign: 'center', fontFamily: FF, fontSize: '50px', fontWeight: 600, lineHeight: 1.3, color: cfg, opacity: interp(frame, [s0 + 70, s0 + 94], [0, 1], easeOutExpo)}}>
        <AccentCaption text={caption} cac={cac} />
      </div>
    </div>
  );
};
