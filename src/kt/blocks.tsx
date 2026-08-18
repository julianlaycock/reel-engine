// KT BLOCKS — the pieces a film is built from.
//
// FOUNDER, 2026-08-16: "Nothing should block anything. This should be de facto
// applied by default... there's no differing from canonized rules from video to
// video."
//
// Everything before this was a gate: measure the film after it is built, report
// that a value is wrong. That is an autopsy, and it only ever finds the mistakes
// somebody thought to check for. NO. 034 passed every gate it had while carrying
// five arrival speeds, five plate heights, eight arbitrary gaps, five ad-hoc type
// sizes, and two plates that rendered completely invisible.
//
// These components hold the canon instead. The rule is not "do not type a wrong
// margin" — it is that a film HAS NO PLACE TO TYPE A MARGIN. `Plate` is where
// plates go. `T` has the sizes there are. Colour is decided by the field a thing
// lands on and is never named. A film says what something IS; the system decides
// how it looks.
//
// What a film still owns: which visualisations exist and what they show, the
// script, the beats, the fields and their order, the figures, the length. The test,
// in the founder's words: if it carries the BRAND it is fixed, if it carries the
// STORY it is free.
//
// Values come from ./system, which is GENERATED from canon/kt-tokens.json#system.
// Nothing here restates a number.
import React, {createContext, useContext} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {
  CANVAS, MARGIN_X, COLUMN_W, PLATE_TOP, gap, Gap,
  FAMILY, ROLES, Role,
  FIELD, TEXT_ON, LABEL_ON, HAIR_ON, WASH_ON, ACCENT_ON, Field, fieldOf,
  ENTER_MS, DETAIL_MS, TRAVEL_PX, ease, clamp01,
} from './system';

export const f = (ms: number) => Math.round((ms / 1000) * CANVAS.fps);

// ---- the field a thing is standing on ---------------------------------------
// Carried in context rather than passed down, so no component can be handed the
// wrong one and no component can forget to pass it on. Two plates in NO. 034 were
// invisible because their colours were a property of where they were WRITTEN
// instead of where they were SHOWN; that is not expressible here.
const FieldCtx = createContext<Field>('ink');
export const useField = () => useContext(FieldCtx);

export const Stage: React.FC<{field: Field; children: React.ReactNode}> = ({field, children}) => (
  <FieldCtx.Provider value={field}>
    <AbsoluteFill style={{backgroundColor: FIELD[field], fontFamily: FAMILY.display}}>
      {children}
    </AbsoluteFill>
  </FieldCtx.Provider>
);

// ---- type -------------------------------------------------------------------
// A film asks for a ROLE. There is no size prop, because a size prop is how a
// format grows twenty-one sizes and then five more on the plates.
export const T: React.FC<{
  role: Role;
  tone?: 'text' | 'label' | 'accent';
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}> = ({role, tone = 'text', align = 'left', children}) => {
  const field = useField();
  const r = ROLES[role];
  const colour = tone === 'label' ? LABEL_ON[field]
    : tone === 'accent' ? ACCENT_ON[field]
    : TEXT_ON[field];
  return (
    <div style={{
      fontFamily: FAMILY[r.family as 'display' | 'ui'],
      fontSize: r.size,
      fontWeight: r.weight,
      letterSpacing: r.tracking,
      lineHeight: r.leading,
      color: colour,
      textAlign: align,
      whiteSpace: 'pre-wrap',
    }}>
      {children}
    </div>
  );
};

// ---- space ------------------------------------------------------------------
// Gaps come off the ladder or they do not exist. `gap` takes a name, not a number.
export const Stack: React.FC<{gap: Gap; align?: 'flex-start' | 'center' | 'flex-end'; children: React.ReactNode}> =
  ({gap: g, align = 'flex-start', children}) => (
    <div style={{display: 'flex', flexDirection: 'column', rowGap: gap(g), alignItems: align}}>
      {children}
    </div>
  );

export const Row: React.FC<{gap: Gap; justify?: 'flex-start' | 'space-between' | 'center'; children: React.ReactNode}> =
  ({gap: g, justify = 'space-between', children}) => (
    <div style={{display: 'flex', columnGap: gap(g), justifyContent: justify, alignItems: 'baseline'}}>
      {children}
    </div>
  );

// ---- the plate --------------------------------------------------------------
// One height, one width, one margin, every film. NO. 034 had five different plate
// heights, so the eye had to re-find the top of the picture at every section.
// There is no `top` prop. That is the point.
export const Plate: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{position: 'absolute', left: MARGIN_X, top: PLATE_TOP, width: COLUMN_W}}>
    {children}
  </div>
);

// ---- rules and fills --------------------------------------------------------
export const Rule: React.FC<{weight?: 'hair' | 'rule' | 'heavy'}> = ({weight = 'rule'}) => {
  const field = useField();
  return <div style={{
    height: weight === 'hair' ? 1 : weight === 'heavy' ? 3 : 2,
    background: weight === 'hair' ? HAIR_ON[field] : TEXT_ON[field],
    opacity: weight === 'hair' ? 1 : 0.5,
  }} />;
};

export const Wash: React.FC<{children?: React.ReactNode}> = ({children}) => {
  const field = useField();
  return <div style={{background: WASH_ON[field], padding: gap('m')}}>{children}</div>;
};

// ---- arrival ----------------------------------------------------------------
// One arrival. NO. 034 had five durations and two travel distances two pixels
// apart, none of which any viewer could name and all of which had to be maintained.
export const Enter: React.FC<{at: number; detail?: boolean; children: React.ReactNode}> =
  ({at, detail = false, children}) => {
    const frame = useCurrentFrame();
    const dur = f(detail ? DETAIL_MS : ENTER_MS);
    const t = ease(clamp01((frame - f(at)) / Math.max(1, dur)));
    if (t <= 0) return null;
    return (
      <div style={{opacity: t, transform: `translateY(${(1 - t) * TRAVEL_PX}px)`}}>
        {children}
      </div>
    );
  };

export {FIELD, fieldOf, gap};
export type {Field, Role, Gap};
