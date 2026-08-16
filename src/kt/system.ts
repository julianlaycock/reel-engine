// GENERATED FROM canon/kt-tokens.json#system — DO NOT EDIT BY HAND.
//
// Regenerate with:  node scripts/gen-kt-system.mjs   (from the vektor repo)
// check-kt fails the build if this file and the canon disagree.
//
// A film imports from here and from ./blocks. It does not restate any value below,
// because a value a film can restate is a value a film can get wrong — which is how
// five arrival speeds, five plate heights and eight arbitrary gaps got into NO. 034
// while every gate reported green.

export type Role = 'hero' | 'title' | 'line' | 'body' | 'slug' | 'label' | 'wordmark';
export type Field = 'ink' | 'cream' | 'redDeep';

// ---- space ------------------------------------------------------------------
export const CANVAS = {"w":1080,"h":1920,"fps":30} as const;
export const SAFE = {"x0":150,"x1":930,"y0":220,"y1":1420} as const;
export const MARGIN_X = 150;
export const COLUMN_W = 780;
export const PLATE_TOP = 860;

// Every gap in a film comes from this ladder. `gap('m')` — never a number.
export const LADDER = [8,16,24,40,64,96] as const;
export type Gap = 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl';
const GAP_INDEX: Record<Gap, number> = {xs: 0, s: 1, m: 2, l: 3, xl: 4, xxl: 5};
export const gap = (g: Gap): number => LADDER[GAP_INDEX[g]];

// ---- type -------------------------------------------------------------------
export const FAMILY = {"display":"\"Printvetica\", \"Helvetica Neue\", sans-serif","ui":"\"Inter Tight\", sans-serif"} as const;
export const ROLES = {"hero":{"family":"display","size":134,"weight":400,"tracking":0,"leading":1.06},"title":{"family":"display","size":86,"weight":400,"tracking":0,"leading":1.1},"line":{"family":"display","size":55,"weight":400,"tracking":0,"leading":1.14},"body":{"family":"display","size":44,"weight":400,"tracking":0,"leading":1.14},"slug":{"family":"ui","size":26,"weight":400,"tracking":3,"leading":1.2},"label":{"family":"ui","size":20,"weight":400,"tracking":2,"leading":1.2},"wordmark":{"family":"ui","size":40,"weight":600,"tracking":-1.8,"leading":1}} as const;
export const MAX_LINES_ON_SCREEN = 1;

// ---- colour -----------------------------------------------------------------
// A film never names a colour. It says what a thing IS; the field decides how it
// looks. Two plates rendered completely invisible in this film because they were
// authored against one field and mounted on another.
export const FIELD = {"ink":"#101010","cream":"#F4EFDF","redDeep":"#DB3419"} as const;
export const TEXT_ON = {"ink":"#F4EFDF","cream":"#101010","redDeep":"#FFFFFF"} as const;
export const LABEL_ON = {"ink":"rgba(244,239,223,0.55)","cream":"rgba(16,16,16,0.62)","redDeep":"#FFFFFF"} as const;
export const HAIR_ON = {"ink":"rgba(244,239,223,0.26)","cream":"rgba(16,16,16,0.28)","redDeep":"rgba(255,255,255,0.5)"} as const;
export const WASH_ON = {"ink":"rgba(244,239,223,0.10)","cream":"rgba(16,16,16,0.08)","redDeep":"rgba(255,255,255,0.10)"} as const;
export const ACCENT_ON = {"ink":"#DB3419","cream":"#DB3419","redDeep":"#FFFFFF"} as const;

export const fieldOf = (hex: string): Field => {
  const hit = (Object.entries(FIELD) as [Field, string][])
    .find(([, v]) => v.toLowerCase() === hex.toLowerCase());
  return hit ? hit[0] : 'ink';
};

// ---- motion -----------------------------------------------------------------
export const ENTER_MS = 500;
export const DETAIL_MS = 300;
export const EXIT_MS = 300;
export const TRAVEL_PX = 16;
export const WIPE = {"leadFrames":10,"tailFrames":6} as const;

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
// The one curve. Slow-in, fast-mid, long decelerating tail, no overshoot.
export const ease = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
