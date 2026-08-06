import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import {defaultVideo, FPS, totalFrames} from './video-schema';
import {TransitionDemo, demoDuration, type TransitionVariant} from './TransitionDemo';
import {KTHook, KT_HOOK_FRAMES} from './KTHook';
import {KTFxDemo, KT_FX_DEMO_FRAMES} from './KTFxDemo';
import {KTTax, KT_TAX_FRAMES} from './KTTax';

export const Root: React.FC = () => {
  return (
    <>
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
        id="KTHook"
        component={KTHook}
        durationInFrames={KT_HOOK_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{variant: 'radial' as const}}
      />
      <Composition
        id="KTTax"
        component={KTTax}
        durationInFrames={KT_TAX_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="KTFxDemo"
        component={KTFxDemo}
        durationInFrames={KT_FX_DEMO_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="KTHookHybrid"
        component={KTHook}
        durationInFrames={KT_HOOK_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{variant: 'hybrid' as const}}
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
    </>
  );
};
