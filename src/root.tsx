import React from 'react';
import {Composition} from 'remotion';
import {AnimatedCard} from './AnimatedCard';
import {defaultCard} from './schema';
import {Video} from './Video';
import {defaultVideo, FPS, totalFrames} from './video-schema';
import {TransitionDemo, demoDuration, type TransitionVariant} from './TransitionDemo';
import {Doctrine} from './Doctrine';
import {DoctrineFilm} from './DoctrineFilm';
import {defaultBrief} from './doctrine-schema';
import {briefTotalFrames, filmTotalFrames} from './doctrine-layout';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="Card"
        component={AnimatedCard}
        durationInFrames={defaultCard.durationInFrames}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{card: defaultCard}}
        calculateMetadata={({props}) => ({
          durationInFrames: props.card.durationInFrames,
          fps: 30,
          width: 1080,
          height: 1920,
        })}
      />
      <Composition
        id="Video"
        component={Video}
        durationInFrames={totalFrames(defaultVideo)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{video: defaultVideo}}
        calculateMetadata={({props}) => ({
          durationInFrames: totalFrames(props.video),
          fps: props.video.fps ?? FPS,
          width: props.video.width ?? 1080,
          height: props.video.height ?? 1920,
        })}
      />
      <Composition
        id="TransitionDemo"
        component={TransitionDemo}
        durationInFrames={demoDuration('spring-slide', FPS)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{video: defaultVideo, variant: 'spring-slide' as TransitionVariant}}
        calculateMetadata={({props}) => ({
          durationInFrames: demoDuration(props.variant, props.video.fps ?? FPS),
          fps: props.video.fps ?? FPS,
          width: props.video.width ?? 1080,
          height: props.video.height ?? 1920,
        })}
      />
      <Composition
        id="Doctrine"
        component={Doctrine}
        durationInFrames={briefTotalFrames(defaultBrief)}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{brief: defaultBrief}}
        calculateMetadata={({props}) => ({
          durationInFrames: briefTotalFrames(props.brief),
          fps: props.brief.fps ?? 30,
          width: 1080,
          height: 1920,
        })}
      />
      <Composition
        id="DoctrineFilm"
        component={DoctrineFilm}
        durationInFrames={filmTotalFrames(defaultBrief)}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{brief: defaultBrief}}
        calculateMetadata={({props}) => ({
          durationInFrames: filmTotalFrames(props.brief),
          fps: props.brief.fps ?? 30,
          width: 1080,
          height: 1920,
        })}
      />
    </>
  );
};
