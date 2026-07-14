import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import type {GenerativeScene} from '../video-schema';
import {SpecimenOverlay} from './_overlay';
import {COLORS} from '@tokens/tokens';

const DEFAULT_PALETTE = [COLORS.teal, COLORS.vmaxBlue, COLORS.vmaxMint];

// Frame-driven camera: slow orbit + gentle dolly-in. Pure function of frame, so
// the render is deterministic and scrubbable.
const CameraRig: React.FC<{spin: number; frames: number}> = ({spin, frames}) => {
  const cam = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, Math.max(frames - 1, 1)], [0, 1], {extrapolateRight: 'clamp'});
  const az = -0.55 + spin * p;
  const radius = interpolate(p, [0, 1], [3.9, 3.1], {easing: Easing.inOut(Easing.cubic)});
  const el = 0.32 + 0.12 * Math.sin(p * Math.PI);
  cam.position.set(Math.sin(az) * Math.cos(el) * radius, Math.sin(el) * radius, Math.cos(az) * Math.cos(el) * radius);
  cam.lookAt(0, 0, 0);
  cam.near = 0.1;
  cam.far = 100;
  cam.updateProjectionMatrix();
  return null;
};

const Filaments: React.FC<{count: number; palette: string[]; additive: boolean}> = ({
  count,
  palette,
  additive,
}) => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const t = frame / fps;

  const seeds = useMemo(() => {
    const rnd = (n: number) => {
      const x = Math.sin(n * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
    const arr: {bx: number; by: number; bz: number; c: THREE.Color; sp: number}[] = [];
    const R = 1.25;
    for (let i = 0; i < count; i++) {
      const u = rnd(i + 1);
      const v = rnd(i + 101.7);
      const theta = Math.acos(2 * u - 1);
      const phi = 2 * Math.PI * v;
      const ci = Math.floor(rnd(i + 7.3) * palette.length) % palette.length;
      arr.push({
        bx: Math.sin(theta) * Math.cos(phi) * R,
        by: Math.cos(theta) * R,
        bz: Math.sin(theta) * Math.sin(phi) * R,
        c: new THREE.Color(palette[ci]),
        sp: 0.5 + rnd(i + 3.1) * 0.9,
      });
    }
    return arr;
  }, [count, palette.join(',')]);

  const {positions, colors} = useMemo(() => {
    const pos = new Float32Array(count * 2 * 3);
    const col = new Float32Array(count * 2 * 3);
    const amp = 0.5;
    const F = 1.7;
    const dt = 0.07;
    const disp = (x: number, y: number, z: number, tt: number): [number, number, number] => [
      Math.sin(y * F + tt) + 0.5 * Math.cos(z * F * 1.7 - tt),
      Math.cos(z * F - tt) + 0.5 * Math.sin(x * F * 1.7 + tt),
      Math.sin(x * F + tt) + 0.5 * Math.cos(y * F * 1.7 - tt),
    ];
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const tt = t * s.sp;
      const d1 = disp(s.bx, s.by, s.bz, tt);
      const d0 = disp(s.bx, s.by, s.bz, tt - dt);
      const o = i * 6;
      pos[o] = s.bx + d0[0] * amp;
      pos[o + 1] = s.by + d0[1] * amp;
      pos[o + 2] = s.bz + d0[2] * amp;
      pos[o + 3] = s.bx + d1[0] * amp;
      pos[o + 4] = s.by + d1[1] * amp;
      pos[o + 5] = s.bz + d1[2] * amp;
      col[o] = s.c.r;
      col[o + 1] = s.c.g;
      col[o + 2] = s.c.b;
      col[o + 3] = s.c.r;
      col[o + 4] = s.c.g;
      col[o + 5] = s.c.b;
    }
    return {positions: pos, colors: col};
  }, [seeds, t, count]);

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={additive ? 0.55 : 0.72}
        blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
};

export const Generative: React.FC<{scene: GenerativeScene; hideChrome: boolean}> = ({scene}) => {
  const {width, height} = useVideoConfig();
  const palette = scene.palette ?? DEFAULT_PALETTE;
  const additive = scene.blend !== 'normal';
  return (
    <AbsoluteFill>
      <ThreeCanvas
        width={width}
        height={height}
        style={{background: 'transparent'}}
        camera={{fov: 45, position: [0, 1.2, 3.6]}}
      >
        <CameraRig spin={scene.spin ?? 0.7} frames={scene.durationInFrames} />
        <ambientLight intensity={1} />
        <Filaments count={scene.particles ?? 3500} palette={palette} additive={additive} />
      </ThreeCanvas>
      <SpecimenOverlay
        eyebrow={scene.eyebrow}
        headline={scene.headline}
        accentWords={scene.accentWords}
        sub={scene.sub}
      />
    </AbsoluteFill>
  );
};
