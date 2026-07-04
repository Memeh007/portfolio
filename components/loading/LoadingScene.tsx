"use client";

import { caffeine } from "@/data/molecules/caffeine";
import BallStickMolecule from "@/components/molecule/BallStickMolecule";
import { withBasePath } from "@/lib/base-path";
import { Center, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { Group, Object3D } from "three";
import * as THREE from "three";

const logoPath = withBasePath("/logo.glb");

function fitObjectScale(object: Object3D, viewportWidth: number, viewportHeight: number) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const isPortrait = viewportHeight > viewportWidth;
  const widthBudget = viewportWidth * (isPortrait ? 0.88 : 0.62);
  const heightBudget = viewportHeight * (isPortrait ? 0.52 : 0.58);
  return Math.min(widthBudget, heightBudget) / maxDim;
}

function ResponsiveOrthographicCamera() {
  const { camera, size } = useThree();

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return;
    camera.zoom = size.width <= 640 ? 42 : 50;
    camera.updateProjectionMatrix();
  }, [camera, size.width]);

  return null;
}

function LogoModel() {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF(logoPath);
  const { viewport } = useThree();

  const model = useMemo(() => scene.clone(true), [scene]);

  const scale = useMemo(
    () => fitObjectScale(model, viewport.width, viewport.height),
    [model, viewport.width, viewport.height],
  );

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.875;
  });

  return (
    <group ref={groupRef}>
      <Center>
        <primitive object={model} scale={scale} />
      </Center>
    </group>
  );
}

type BouncerConfig = {
  position: [number, number, number];
  velocity: [number, number];
  scale: number;
  spin: number;
};

function BouncingMolecule({ config }: { config: BouncerConfig }) {
  const groupRef = useRef<Group>(null);
  const velocity = useRef({ x: config.velocity[0], y: config.velocity[1] });
  const { viewport, size } = useThree();

  const bounds = useMemo(() => {
    const isPortrait = viewport.height > viewport.width;
    const sidePad = isPortrait ? 0.9 : 1.2;
    const topPad = isPortrait ? 0.8 : 1.2;
    const bottomPad = isPortrait ? 2.4 : 1.4;

    return {
      minX: -viewport.width / 2 + sidePad,
      maxX: viewport.width / 2 - sidePad,
      minY: -viewport.height / 2 + topPad,
      maxY: viewport.height / 2 - bottomPad,
    };
  }, [viewport.height, viewport.width]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const speedScale = size.width <= 640 ? 0.85 : 1;
    group.position.x += velocity.current.x * delta * speedScale;
    group.position.y += velocity.current.y * delta * speedScale;

    if (group.position.x <= bounds.minX || group.position.x >= bounds.maxX) {
      velocity.current.x *= -1;
      group.position.x = THREE.MathUtils.clamp(
        group.position.x,
        bounds.minX,
        bounds.maxX,
      );
    }

    if (group.position.y <= bounds.minY || group.position.y >= bounds.maxY) {
      velocity.current.y *= -1;
      group.position.y = THREE.MathUtils.clamp(
        group.position.y,
        bounds.minY,
        bounds.maxY,
      );
    }

    group.rotation.x += delta * config.spin * 0.6;
    group.rotation.y += delta * config.spin;
  });

  return (
    <group ref={groupRef} position={config.position} scale={config.scale}>
      <BallStickMolecule molecule={caffeine} targetSize={2.4} />
    </group>
  );
}

function BouncingMolecules() {
  const { viewport, size } = useThree();
  const isMobile = size.width <= 640;
  const count = isMobile ? 6 : 10;

  const configs = useMemo<BouncerConfig[]>(() => {
    const spreadX = isMobile ? viewport.width * 0.55 : viewport.width * 0.65;
    const spreadY = isMobile ? viewport.height * 0.4 : viewport.height * 0.45;

    return Array.from({ length: count }, (_, index) => ({
      position: [
        (Math.random() - 0.5) * spreadX,
        (Math.random() - 0.5) * spreadY,
        -index * 0.05,
      ] as [number, number, number],
      velocity: [
        (Math.random() > 0.5 ? 1 : -1) * (1.4 + Math.random() * 1.2),
        (Math.random() > 0.5 ? 1 : -1) * (1.1 + Math.random() * 1),
      ] as [number, number],
      scale: (isMobile ? 0.07 : 0.11) + Math.random() * 0.04,
      spin: 0.4 + Math.random() * 0.5,
    }));
  }, [count, isMobile, viewport.height, viewport.width]);

  return (
    <>
      {configs.map((config, index) => (
        <BouncingMolecule key={index} config={config} />
      ))}
    </>
  );
}

function LoadingSceneContent() {
  return (
    <>
      <ResponsiveOrthographicCamera />
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 8]} intensity={1.1} />
      <directionalLight position={[-3, -2, 5]} intensity={0.35} />
      <BouncingMolecules />
      <LogoModel />
    </>
  );
}

export default function LoadingScene() {
  useEffect(() => {
    useGLTF.preload(logoPath);
  }, []);

  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 20], zoom: 50 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      style={{ background: "#fafafa", touchAction: "none" }}
    >
      <Suspense fallback={null}>
        <LoadingSceneContent />
      </Suspense>
    </Canvas>
  );
}
