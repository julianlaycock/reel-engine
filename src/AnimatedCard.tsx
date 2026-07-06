import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {CardJson, CardProps} from './schema';
import {accentPop, drawX, driftScale, fadeRise, pop} from './animation';
import './style.css';

const splitAccent = (text: string, accentWords: string[] = []) => {
  const clean = text.replace(/[{}]/g, '');
  const word = accentWords.find((candidate) =>
    clean.toLowerCase().includes(candidate.toLowerCase()),
  );

  if (!word) {
    return <>{clean}</>;
  }

  const idx = clean.toLowerCase().indexOf(word.toLowerCase());
  return (
    <>
      {clean.slice(0, idx)}
      <span className="r accent-word">{clean.slice(idx, idx + word.length)}</span>
      {clean.slice(idx + word.length)}
    </>
  );
};

const MetaBars: React.FC<{card: CardJson}> = ({card}) => {
  const frame = useCurrentFrame();
  const barOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ruleScale = drawX(frame, 0, 12);

  return (
    <>
      <div className="topbar" style={{opacity: barOpacity}}>
        <div className="top-rule" style={{transform: `scaleX(${ruleScale})`}} />
        <span className="meta">
          <span className="redmark" />
          {card.kicker}
        </span>
        <span className="meta">{card.kickerRight}</span>
      </div>
      <div className="botbar" style={{opacity: barOpacity}}>
        <span className="meta">caelithlabs.com</span>
        <span className="meta">{card.footerRight}</span>
      </div>
    </>
  );
};

const StatCard: React.FC<{card: CardJson}> = ({card}) => {
  const frame = useCurrentFrame();
  const first = card.lines?.[0] ?? 'A.I. is their\n#1 priority.';
  const second = card.lines?.[1] ?? '{almost none}\nhave shipped it.';

  return (
    <div className="mid">
      <div className="head" style={fadeRise(frame, 15)}>
        {first.split('\n').map((line, index) => (
          <React.Fragment key={line}>
            {line}
            {index === 0 ? <br /> : null}
          </React.Fragment>
        ))}
      </div>
      <div
        className="hr"
        style={{
          transform: `scaleX(${drawX(frame, 30, 12)})`,
          transformOrigin: 'left',
        }}
      />
      <div className="head" style={fadeRise(frame, 39, 15)}>
        <span className="r accent-word" style={{transform: accentPop(frame, 52)}}>
          {second.replace(/[{}]/g, '').split('\n')[0]}
        </span>
        <br />
        {second.replace(/[{}]/g, '').split('\n')[1]}
      </div>
      <div className="sub" style={fadeRise(frame, 60, 12)}>
        {card.sub}
      </div>
    </div>
  );
};

const StatementCard: React.FC<{card: CardJson}> = ({card}) => {
  const frame = useCurrentFrame();
  const first = card.lines?.[0] ?? 'start with the';
  const accent = card.lines?.[1] ?? 'workflow.';
  const sub = card.sub ?? 'not the tool.';

  return (
    <div className="mid">
      <div className="head head-large">
        <div style={fadeRise(frame, 15)}>{first}</div>
        <div
          className="r accent-word"
          style={{...fadeRise(frame, 30, 12), transform: `${fadeRise(frame, 30, 12).transform} ${accentPop(frame, 40)}`}}
        >
          {accent}
        </div>
      </div>
      <div className="sub sub-strong" style={fadeRise(frame, 48, 12)}>
        {sub}
      </div>
    </div>
  );
};

const FlowCard: React.FC<{card: CardJson; sceneDuration?: number}> = ({
  card,
  sceneDuration,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nodes = card.nodes ?? ['01  INPUT', '02  CLASSIFY', '03  ROUTE', '04  FLAG'];

  // Build node-by-node. Spread the reveals across the scene so each node lands
  // as the voiceover names it (progressive disclosure), then hold + pulse.
  const count = nodes.length;
  const dense = count > 4;
  const sd = sceneDuration ?? 240;
  const buildWindow = Math.min(sd * 0.72, sd - 24);
  const step = Math.max(11, Math.min(72, Math.round(buildWindow / count)));
  const nodeStart = (i: number) => 16 + i * step;
  const connStart = (i: number) => nodeStart(i) + 8;
  const builtFrame = nodeStart(count - 1) + 14;

  // Connector geometry + a packet that travels down each connector and cascades
  // through the chain (so the flow reads as data moving, not a static diagram).
  const connH = dense ? 30 : 46;
  const period = 78;
  const nodeStyle = dense
    ? {fontSize: 40, padding: '16px 40px', lineHeight: 1.1}
    : undefined;
  const taglineStart = builtFrame + 6;

  return (
    <div className="mid mid-flow">
      <div className="flow">
        {nodes.map((node, index) => {
          const localStart = builtFrame + index * 6;
          const local = ((frame - localStart) % period + period) % period;
          const travel = interpolate(local, [0, 20], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const pulseOpacity =
            frame < builtFrame
              ? 0
              : interpolate(local, [0, 3, 17, 21], [0, 0.75, 0.75, 0], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });
          return (
            <React.Fragment key={node}>
              <div className="node" style={{...pop(frame, nodeStart(index), fps), ...nodeStyle}}>
                {node.replace(/ /g, '\u00a0')}
              </div>
              {index < count - 1 ? (
                <div className="conn-wrap" style={{height: connH}}>
                  <div
                    className="conn"
                    style={{
                      height: connH,
                      transform: `scaleY(${drawX(frame, connStart(index), 10)})`,
                      transformOrigin: 'top',
                    }}
                  />
                  <div
                    className="conn-pulse"
                    style={{
                      opacity: pulseOpacity,
                      transform: `translateY(${travel * (connH - 8)}px)`,
                    }}
                  />
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
      <div className="tagline">
        {(card.tagline ?? 'every step gets an {owner}.\nthen automate.')
          .split('\n')
          .map((line, index) => (
            <div key={line} style={fadeRise(frame, taglineStart + index * 12, 12)}>
              {splitAccent(line, card.accentWords)}
            </div>
          ))}
      </div>
    </div>
  );
};

const ResultCard: React.FC<{card: CardJson}> = ({card}) => {
  const frame = useCurrentFrame();
  const first = card.lines?.[0] ?? "the tool didn't change.";
  const second = card.lines?.[1] ?? 'the thinking did.';

  return (
    <div className="mid">
      <div className="head head-result">
        <div style={fadeRise(frame, 15)}>{first}</div>
        <div
          className="r accent-word"
          style={{...fadeRise(frame, 33, 12), transform: `${fadeRise(frame, 33, 12).transform} ${accentPop(frame, 43)}`}}
        >
          {second}
        </div>
      </div>
      <div
        className="hr"
        style={{
          transform: `scaleX(${drawX(frame, 48, 12)})`,
          transformOrigin: 'left',
        }}
      />
      <div className="sub" style={fadeRise(frame, 57, 12)}>
        {card.sub}
      </div>
    </div>
  );
};

export const AnimatedCard: React.FC<
  CardProps & {sceneDuration?: number; hideChrome?: boolean}
> = ({card, sceneDuration, hideChrome}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  // Inside a multi-scene video, drift should span this scene, not the whole
  // composition — callers pass sceneDuration; the single-card comp omits it.
  const scale = driftScale(frame, sceneDuration ?? durationInFrames);

  return (
    <AbsoluteFill>
      <div className="frame">
        <div className="drift" style={{transform: `scale(${scale})`}}>
          {hideChrome ? null : <MetaBars card={card} />}
          {card.type === 'stat' ? <StatCard card={card} /> : null}
          {card.type === 'statement' ? <StatementCard card={card} /> : null}
          {card.type === 'flow' ? <FlowCard card={card} sceneDuration={sceneDuration} /> : null}
          {card.type === 'result' ? <ResultCard card={card} /> : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
