import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import type {Heatmap3DScene} from '../video-schema';
import {SpecimenOverlay} from './_overlay';
import {COLORS} from '@tokens/tokens';

const DEFAULT_PALETTE = [COLORS.teal, COLORS.vmaxBlue];

const poisson = (k: number, lambda: number) => {
  let fact = 1;
  for (let i = 2; i <= k; i++) fact *= i;
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / fact;
};

const CameraRig: React.FC<{spin: number; frames: number}> = ({spin, frames}) => {
  const cam = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, Math.max(frames - 1, 1)], [0, 1], {extrapolateRight: 'clamp'});
  const az = -0.7 + spin * p;
  const radius = interpolate(p, [0, 1], [4.6, 3.9], {easing: Easing.inOut(Easing.cubic)});
  const el = 0.55 + 0.12 * Math.sin(p * Math.PI);
  cam.position.set(Math.sin(az) * Math.cos(el) * radius, Math.sin(el) * radius + 0.6, Math.cos(az) * Math.cos(el) * radius);
  cam.lookAt(0, 0.1, 0);
  cam.near = 0.1;
  cam.far = 100;
  cam.updateProjectionMatrix();
  return null;
};

const Bars: React.FC<{
  size: number;
  lambdaHome: number;
  lambdaAway: number;
  grid?: number[][];
  palette: string[];
}> = ({size, lambdaHome, lambdaAway, grid, palette}) => {
  const frame = useCurrentFrame();
  const high = useMemo(() => new THREE.Color(palette[0] ?? DEFAULT_PALETTE[0]), [palette]);
  const low = useMemo(() => new THREE.Color(palette[1] ?? DEFAULT_PALETTE[1]), [palette]);

  const cells = useMemo(() => {
    const out: {i: number; j: number; h: number}[] = [];
    let max = 0;
    const m: number[][] = [];
    for (let i = 0; i <= size; i++) {
      m[i] = [];
      for (let j = 0; j <= size; j++) {
        const v = grid?.[i]?.[j] ?? poisson(i, lambdaHome) * poisson(j, lambdaAway);
        m[i][j] = v;
        if (v > max) max = v;
      }
    }
    for (let i = 0; i <= size; i++)
      for (let j = 0; j <= size; j++) out.push({i, j, h: max > 0 ? m[i][j] / max : 0});
    return out;
  }, [size, lambdaHome, lambdaAway, grid]);

  const gap = 0.42;
  const span = size * gap;
  return (
    <group>
      {cells.map((c) => {
        const grow = interpolate(frame, [(c.i + c.j) * 1.6 + 6, (c.i + c.j) * 1.6 + 34], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
        const h = Math.max(0.012, c.h * 2.4 * grow);
        const color = low.clone().lerp(high, c.h);
        return (
          <mesh key={`${c.i}-${c.j}`} position={[c.i * gap - span / 2, h / 2, c.j * gap - span / 2]}>
            <boxGeometry args={[gap * 0.78, h, gap * 0.78]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} roughness={0.45} metalness={0.1} />
          </mesh>
        );
      })}
      {/* base plate — tinted with the data colour so it reads on any background */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[span + gap, span + gap]} />
        <meshStandardMaterial color={low} transparent opacity={0.16} />
      </mesh>
    </group>
  );
};

export const Heatmap3D: React.FC<{scene: Heatmap3DScene; hideChrome: boolean}> = ({scene}) => {
  const {width, height} = useVideoConfig();
  const size = scene.size ?? 5;
  return (
    <AbsoluteFill>
      <ThreeCanvas
        width={width}
        height={height}
        style={{background: 'transparent'}}
        camera={{fov: 42, position: [0, 2.6, 4.4]}}
      >
        <CameraRig spin={scene.spin ?? 0.9} frames={scene.durationInFrames} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 8, 5]} intensity={1.3} />
        <directionalLight position={[-5, 4, -3]} intensity={0.5} />
        <Bars
          size={size}
          lambdaHome={scene.lambdaHome ?? 1.6}
          lambdaAway={scene.lambdaAway ?? 1.1}
          grid={scene.grid}
          palette={scene.palette ?? DEFAULT_PALETTE}
        />
      </ThreeCanvas>
      <SpecimenOverlay
        eyebrow={scene.eyebrow}
        headline={scene.headline}
        caption={scene.caption}
        formula={scene.formula}
      />
    </AbsoluteFill>
  );
};
