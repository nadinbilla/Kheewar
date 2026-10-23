"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { AvatarAppearance } from "@/lib/avatar-options";
import VoxelAvatar from "@/components/avatar/VoxelAvatar";

export default function AvatarPreview({ appearance }: { appearance: AvatarAppearance }) {
  return (
    <div className="avatar-studio-canvas">
      <Canvas camera={{ position: [3.7, 3.5, 5.3], fov: 38, near: 0.1, far: 40 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={1.15} />
        <hemisphereLight args={["#e8fbff", "#546350", 1.6]} />
        <directionalLight position={[-3, 7, 5]} intensity={2.15} />
        <directionalLight position={[4, 5, -3]} intensity={0.9} color="#d1caff" />
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[1.45, 1.55, 0.16, 48]} />
          <meshStandardMaterial color="#0a8c86" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.19, 0]}>
          <cylinderGeometry args={[1.33, 1.33, 0.08, 48]} />
          <meshStandardMaterial color="#f5f9eb" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.245, 0]}>
          <cylinderGeometry args={[1.16, 1.16, 0.026, 48]} />
          <meshStandardMaterial color="#c5f4e9" roughness={0.83} />
        </mesh>
        <group position={[0, 0.28, 0]}><VoxelAvatar appearance={appearance}/></group>
        <OrbitControls enablePan={false} target={[0, 1.4, 0]} minDistance={3.3} maxDistance={8} minPolarAngle={0.3} maxPolarAngle={1.85} enableDamping dampingFactor={0.1} />
      </Canvas>
    </div>
  );
}
