import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import {defaultVideo, FPS, totalFrames} from './video-schema';
import {TransitionDemo, demoDuration, type TransitionVariant} from './TransitionDemo';
import {KTHook, KT_HOOK_FRAMES} from './KTHook';
import {KTFxDemo, KT_FX_DEMO_FRAMES} from './KTFxDemo';
import {KTTax, KT_TAX_FRAMES} from './KTTax';
import {KTState, KT_STATE_FRAMES} from './KTState';
import {KTFunnel, KT_FUNNEL_FRAMES} from './KTFunnel';
import {KTStack, KT_STACK_FRAMES} from './KTStack';
import {KTTokens, KT_TOKENS_FRAMES} from './KTTokens';
import {KT3DSpike, KT_3D_SPIKE_FRAMES} from './KT3DSpike';

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
        id="KTFunnel"
        component={KTFunnel}
        durationInFrames={KT_FUNNEL_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="KTTokens"
        component={KTTokens}
        defaultProps={{layer: 'all' as const}}
        durationInFrames={KT_TOKENS_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="KTStack"
        component={KTStack}
        defaultProps={{layer: 'all' as const}}
        durationInFrames={KT_STACK_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="KTState"
        component={KTState}
        durationInFrames={KT_STATE_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="KT3DSlabs"
        component={KT3DSpike}
        defaultProps={{variant: 'slabs' as const}}
        durationInFrames={KT_3D_SPIKE_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="KT3DScreener"
        component={KT3DSpike}
        defaultProps={{variant: 'screener' as const}}
        durationInFrames={KT_3D_SPIKE_FRAMES}
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
