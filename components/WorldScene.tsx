"use client";

import { Html, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import type { LocationId, RemoteAvatar } from "@/lib/types";

type Props = { location: LocationId; displayName: string; countryFlag: string; avatarColor: string; remotePlayers: RemoteAvatar[]; onPositionChange: (position: { x: number; z: number }) => void };

function Avatar({ name, x, z, color, flag, isMe = false, moving = false }: { name: string; x: number; z: number; color: string; flag: string; isMe?: boolean; moving?: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.position.y = Math.sin(clock.elapsedTime * 2 + x) * 0.025;
  });
  return <group ref={group} position={[x, 0, z]}>
    <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.46, 32]} /><meshBasicMaterial color={isMe ? "#d4f4e7" : "#ffffff"} transparent opacity={0.34} /></mesh>
    <mesh position={[0, 0.74, 0]} castShadow><capsuleGeometry args={[0.27, 0.62, 4, 8]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
    <mesh position={[0, 1.38, 0]} castShadow><sphereGeometry args={[0.26, 20, 20]} /><meshStandardMaterial color="#d7a17e" roughness={0.9} /></mesh>
    <mesh position={[0, 1.53, -0.025]}><sphereGeometry args={[0.265, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.54]} /><meshStandardMaterial color="#302820" roughness={1} /></mesh>
    <mesh position={[0, 0.29, 0.015]}><boxGeometry args={[0.18, 0.28, 0.08]} /><meshStandardMaterial color="#f0c7a5" /></mesh>
    <Html position={[0, 1.95, 0]} center distanceFactor={10} zIndexRange={[20, 0]}>
      <div className={`avatar-name-tag ${isMe ? "avatar-name-me" : ""}`}><span>{flag}</span><strong>{name}</strong>{isMe && <i>YOU</i>}</div>
    </Html>
    {moving && <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.49, 0.53, 32]} /><meshBasicMaterial color="#5bd3a7" /></mesh>}
  </group>;
}

function CafeFurniture() {
  return <group>
    <mesh position={[0, 0.62, -2.9]} castShadow><boxGeometry args={[5.8, 1.2, 0.7]} /><meshStandardMaterial color="#79513b" roughness={0.8} /></mesh>
    <mesh position={[0, 1.25, -2.9]} castShadow><boxGeometry args={[5.9, 0.12, 0.76]} /><meshStandardMaterial color="#d5a16d" roughness={0.5} /></mesh>
    {[-1.8, 0, 1.8].map((x) => <group key={x} position={[x, 0, -1.15]}><mesh position={[0, 0.72, 0]} castShadow><cylinderGeometry args={[0.57, 0.62, 0.13, 28]} /><meshStandardMaterial color="#d6a16d" /></mesh><mesh position={[0, 0.36, 0]}><cylinderGeometry args={[0.07, 0.09, 0.66, 12]} /><meshStandardMaterial color="#6b4834" /></mesh>{[-0.78, 0.78].map((dx) => <mesh key={dx} position={[dx, 0.36, 0]}><boxGeometry args={[0.42, 0.56, 0.42]} /><meshStandardMaterial color="#5b7d75" /></mesh>)}</group>)}
    <group position={[-3.6, 0, -2.4]}><mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.32, 0.42, 0.95, 10]} /><meshStandardMaterial color="#c18c62" /></mesh><mesh position={[0, 1.2, 0]}><sphereGeometry args={[0.7, 12, 10]} /><meshStandardMaterial color="#5f9d76" /></mesh></group>
    <group position={[3.6, 0, -2.4]}><mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.32, 0.42, 0.95, 10]} /><meshStandardMaterial color="#c18c62" /></mesh><mesh position={[0, 1.2, 0]}><sphereGeometry args={[0.7, 12, 10]} /><meshStandardMaterial color="#5f9d76" /></mesh></group>
  </group>;
}

function HomeFurniture() {
  return <group><mesh position={[0, 0.45, -2.7]} castShadow><boxGeometry args={[3.4, 0.9, 0.8]} /><meshStandardMaterial color="#668a87" /></mesh><mesh position={[0, 0.94, -2.7]}><boxGeometry args={[3.5, 0.16, 0.85]} /><meshStandardMaterial color="#91b1a9" /></mesh><mesh position={[0, 0.48, -0.5]}><boxGeometry args={[1.8, 0.12, 0.9]} /><meshStandardMaterial color="#b88962" /></mesh>{[-0.7, 0.7].map((x) => <mesh key={x} position={[x, 0.24, -0.5]}><boxGeometry args={[0.08, 0.48, 0.08]} /><meshStandardMaterial color="#79563e" /></mesh>)}</group>;
}
function OfficeFurniture() {
  return <group>{[-2, 0, 2].map((x) => <group key={x} position={[x, 0, -2]}><mesh position={[0, 0.95, 0]} castShadow><boxGeometry args={[1.55, 0.12, 0.8]} /><meshStandardMaterial color="#8e9db2" /></mesh><mesh position={[0, 0.5, 0]}><boxGeometry args={[0.08, 0.9, 0.08]} /><meshStandardMaterial color="#49596b" /></mesh><mesh position={[0, 1.13, -0.08]}><boxGeometry args={[0.7, 0.04, 0.45]} /><meshStandardMaterial color="#293b4b" /></mesh></group>)}</group>;
}
function CampusFurniture() {
  return <group>{[-2.5, 2.5].map((x) => <group key={x} position={[x, 0, -2]}><mesh position={[0, 0.5, 0]}><boxGeometry args={[2.1, 0.14, 0.5]} /><meshStandardMaterial color="#b88c62" /></mesh>{[-0.8, 0.8].map((dx) => <mesh key={dx} position={[dx, 0.25, 0]}><boxGeometry args={[0.12, 0.5, 0.4]} /><meshStandardMaterial color="#775c45" /></mesh>)}</group>)}<mesh position={[0, 0.6, -3.6]}><cylinderGeometry args={[0.1, 0.12, 1.2, 8]} /><meshStandardMaterial color="#846044" /></mesh><mesh position={[0, 1.45, -3.6]}><sphereGeometry args={[0.8, 12, 12]} /><meshStandardMaterial color="#6eaa80" /></mesh></group>;
}
function MarketFurniture() {
  return <group>{[-2.6, 0, 2.6].map((x, i) => <group key={x} position={[x, 0, -2.6]}><mesh position={[0, 0.85, 0]}><boxGeometry args={[1.8, 0.12, 1.1]} /><meshStandardMaterial color={i === 1 ? "#bf7b62" : "#d7a56c"} /></mesh><mesh position={[0, 1.5, 0]}><boxGeometry args={[1.95, 0.08, 1.25]} /><meshStandardMaterial color={i === 1 ? "#7d9b80" : "#d99a75"} /></mesh>{[-0.5, 0, 0.5].map((dx, j) => <mesh key={dx} position={[dx, 1.05, 0.05]}><sphereGeometry args={[0.16, 10, 8]} /><meshStandardMaterial color={["#e6b84f", "#c76f55", "#77a76c"][j]} /></mesh>)}</group>)}</group>;
}

function PlayerController({ displayName, countryFlag, avatarColor, onPositionChange }: { displayName: string; countryFlag: string; avatarColor: string; onPositionChange: Props["onPositionChange"] }) {
  const group = useRef<THREE.Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const lastSent = useRef(0);
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const key = event.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        keys.current[key] = true;
        if (key.startsWith("arrow")) event.preventDefault();
      }
    };
    const up = (event: KeyboardEvent) => { keys.current[event.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);
  useFrame((_, delta) => {
    if (!group.current) return;
    const k = keys.current;
    const dx = (k.d || k.arrowright ? 1 : 0) - (k.a || k.arrowleft ? 1 : 0);
    const dz = (k.s || k.arrowdown ? 1 : 0) - (k.w || k.arrowup ? 1 : 0);
    if (dx || dz) {
      const len = Math.hypot(dx, dz) || 1;
      group.current.position.x = THREE.MathUtils.clamp(group.current.position.x + (dx / len) * delta * 2.7, -4.5, 4.5);
      group.current.position.z = THREE.MathUtils.clamp(group.current.position.z + (dz / len) * delta * 2.7, -3.9, 4.2);
      group.current.rotation.y = Math.atan2(dx, dz || 0.0001);
      const now = performance.now();
      if (now - lastSent.current > 160) {
        lastSent.current = now;
        onPositionChange({ x: Number(group.current.position.x.toFixed(2)), z: Number(group.current.position.z.toFixed(2)) });
      }
    }
  });
  return <group ref={group} position={[0, 0, 2]}><Avatar name={displayName} x={0} z={0} color={avatarColor} flag={countryFlag} isMe moving /></group>;
}

function Environment({ location }: { location: LocationId }) {
  const floorColor = location === "campus" ? "#d6d8b4" : location === "market" ? "#d7c4a4" : location === "office" ? "#d2d9de" : location === "home" ? "#d9c9b5" : "#d8c1a4";
  const wallColor = location === "campus" ? "#dce8d6" : location === "office" ? "#dfe5ec" : location === "home" ? "#e9ded0" : location === "market" ? "#e7d7b7" : "#f0ddc2";
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, 0]} receiveShadow><planeGeometry args={[13, 12]} /><meshStandardMaterial color={floorColor} roughness={0.95} /></mesh>
    <mesh position={[0, 2.4, -5.7]} receiveShadow><boxGeometry args={[13, 4.9, 0.22]} /><meshStandardMaterial color={wallColor} roughness={0.95} /></mesh>
    <mesh position={[-6.4, 2.4, 0]}><boxGeometry args={[0.22, 4.9, 11.5]} /><meshStandardMaterial color={wallColor} /></mesh>
    <mesh position={[6.4, 2.4, 0]}><boxGeometry args={[0.22, 4.9, 11.5]} /><meshStandardMaterial color={wallColor} /></mesh>
    <mesh position={[0, 4.85, 0]}><boxGeometry args={[13, 0.2, 11.5]} /><meshStandardMaterial color="#735f51" /></mesh>
    {location === "cafe" && <CafeFurniture />}{location === "home" && <HomeFurniture />}{location === "office" && <OfficeFurniture />}{location === "campus" && <CampusFurniture />}{location === "market" && <MarketFurniture />}
    {location !== "campus" && <mesh position={[0, 3.7, -5.52]}><boxGeometry args={[5.8, 1.2, 0.06]} /><meshStandardMaterial color={location === "cafe" ? "#6e8b80" : "#b1c3c6"} /></mesh>}
    <gridHelper args={[12, 24, "#b7a48d", "#c9b8a3"]} position={[0, -0.045, 0]} />
  </group>;
}

function SceneContents({ location, displayName, countryFlag, avatarColor, remotePlayers, onPositionChange }: Props) {
  return <>
    <color attach="background" args={["#e8e3d9"]} />
    <fog attach="fog" args={["#e8e3d9", 13, 25]} />
    <ambientLight intensity={1.6} />
    <directionalLight position={[5, 10, 5]} intensity={2.1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
    <hemisphereLight args={["#f5f0e8", "#897660", 0.6]} />
    <PerspectiveCamera makeDefault position={[8.7, 8.6, 10.5]} fov={43} />
    <OrbitControls target={[0, 0.65, 0]} enablePan={false} minDistance={8} maxDistance={17} minPolarAngle={0.45} maxPolarAngle={1.28} maxAzimuthAngle={0.85} minAzimuthAngle={-0.85} />
    <Environment location={location} />
    <PlayerController displayName={displayName} countryFlag={countryFlag} avatarColor={avatarColor} onPositionChange={onPositionChange} />
    {remotePlayers.map((player) => <Avatar key={player.id} name={player.name} x={player.x} z={player.z} color={player.color ?? "#8a9de0"} flag={player.country_code === "ID" ? "🇮🇩" : player.country_code === "EG" ? "🇪🇬" : player.country_code === "SA" ? "🇸🇦" : "🌐"} />)}
  </>;
}

export default function WorldScene(props: Props) {
  return <Canvas shadows dpr={[1, 1.7]} gl={{ antialias: true, alpha: false }} camera={{ position: [8.7, 8.6, 10.5], fov: 43 }}><Suspense fallback={null}><SceneContents {...props} /></Suspense></Canvas>;
}
