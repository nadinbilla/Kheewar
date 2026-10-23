"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import type { AvatarAppearance } from "@/lib/avatar-options";

export default function VoxelAvatar({ appearance, movementRef }: { appearance: AvatarAppearance; movementRef?: { current: boolean } }) {
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const isFemale = appearance.avatar_variant === "female_hijab";
  const { avatar_color: clothing, skin_tone: skin, avatar_headwear: headwear, avatar_outfit: outfit } = appearance;
  const trim = outfit === "formal" ? "#f6e3b7" : outfit === "traditional" ? "#edc45e" : "#ffffff";
  const pants = outfit === "formal" ? "#26394c" : outfit === "casual" ? "#425d72" : "#2b4964";

  useFrame(({ clock }) => {
    const moving = Boolean(movementRef?.current);
    const phase = clock.elapsedTime * (moving ? 8.4 : 1.1);
    const swing = moving ? Math.sin(phase) * 0.48 : Math.sin(phase) * 0.025;
    if (leftArm.current) leftArm.current.rotation.x = swing;
    if (rightArm.current) rightArm.current.rotation.x = -swing;
    if (leftLeg.current) leftLeg.current.rotation.x = -swing * 0.74;
    if (rightLeg.current) rightLeg.current.rotation.x = swing * 0.74;
  });

  return (
    <group>
      {/* Kepala bergaya voxel, sengaja berbeda dengan model berkepala bulat sebelumnya. */}
      <mesh position={[0, 2.05, 0]} castShadow>
        <boxGeometry args={[0.64, 0.64, 0.59]} />
        <meshStandardMaterial color={skin} roughness={0.88} />
      </mesh>
      {/* Mata, alis, dan senyum. */}
      {[-0.16, 0.16].map((x) => (
        <group key={x}>
          <mesh position={[x, 2.12, 0.303]}>
            <boxGeometry args={[0.084, 0.12, 0.012]} />
            <meshStandardMaterial color="#241f27" roughness={0.8} />
          </mesh>
          <mesh position={[x, 2.225, 0.307]}>
            <boxGeometry args={[0.132, 0.028, 0.012]} />
            <meshStandardMaterial color="#46362e" roughness={0.95} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.925, 0.307]}>
        <boxGeometry args={[0.16, 0.028, 0.014]} />
        <meshStandardMaterial color="#78443f" roughness={0.95} />
      </mesh>
      {/* Penutup kepala perempuan, peci laki-laki, atau rambut. */}
      {isFemale ? (
        <>
          <mesh position={[0, 2.34, -0.025]} castShadow>
            <boxGeometry args={[0.77, 0.16, 0.7]} />
            <meshStandardMaterial color={clothing} roughness={0.96} />
          </mesh>
          <mesh position={[-0.365, 2.03, 0]} castShadow>
            <boxGeometry args={[0.12, 0.61, 0.66]} />
            <meshStandardMaterial color={clothing} roughness={0.96} />
          </mesh>
          <mesh position={[0.365, 2.03, 0]} castShadow>
            <boxGeometry args={[0.12, 0.61, 0.66]} />
            <meshStandardMaterial color={clothing} roughness={0.96} />
          </mesh>
          <mesh position={[0, 2.06, -0.31]} castShadow>
            <boxGeometry args={[0.75, 0.71, 0.15]} />
            <meshStandardMaterial color={clothing} roughness={0.96} />
          </mesh>
          <mesh position={[0, 1.66, 0.2]} castShadow>
            <boxGeometry args={[headwear === "khimar" ? 0.67 : 0.5, headwear === "khimar" ? 0.6 : 0.29, 0.12]} />
            <meshStandardMaterial color={clothing} roughness={0.96} />
          </mesh>
        </>
      ) : headwear === "peci" ? (
        <mesh position={[0, 2.4, 0]} castShadow>
          <cylinderGeometry args={[0.36, 0.34, 0.26, 8]} />
          <meshStandardMaterial color="#22313b" roughness={0.92} />
        </mesh>
      ) : (
        <mesh position={[0, 2.39, -0.01]} castShadow>
          <boxGeometry args={[0.67, 0.16, 0.62]} />
          <meshStandardMaterial color="#2e292c" roughness={0.96} />
        </mesh>
      )}
      {/* Kemeja/gamis. Laki-laki selalu memakai celana panjang. */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[0.78, isFemale ? 1.03 : 0.85, 0.43]} />
        <meshStandardMaterial color={clothing} roughness={0.88} />
      </mesh>
      {isFemale && (
        <mesh position={[0, 0.66, 0]} castShadow>
          <boxGeometry args={[0.84, 0.58, 0.46]} />
          <meshStandardMaterial color={clothing} roughness={0.9} />
        </mesh>
      )}
      {outfit !== "casual" && (
        <>
          <mesh position={[0, 1.24, 0.226]}>
            <boxGeometry args={[0.09, 0.5, 0.014]} />
            <meshStandardMaterial color={trim} roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.87, 0.237]}>
            <boxGeometry args={[0.54, 0.055, 0.014]} />
            <meshStandardMaterial color={trim} roughness={0.75} />
          </mesh>
        </>
      )}
      {[-1, 1].map((side) => (
        <group key={side}>
          <group ref={side === -1 ? leftArm : rightArm} position={[side * 0.48, 1.43, 0]}>
            <mesh position={[0, -0.31, 0]} castShadow>
              <boxGeometry args={[0.2, 0.64, 0.38]} />
              <meshStandardMaterial color={clothing} roughness={0.86} />
            </mesh>
            <mesh position={[0, -0.67, 0]} castShadow>
              <boxGeometry args={[0.2, 0.12, 0.37]} />
              <meshStandardMaterial color={skin} roughness={0.9} />
            </mesh>
          </group>
          <group ref={side === -1 ? leftLeg : rightLeg} position={[side * 0.19, 0.66, 0]}>
            <mesh position={[0, -0.22, 0]} castShadow>
              <boxGeometry args={[0.31, 0.46, 0.4]} />
              <meshStandardMaterial color={pants} roughness={0.88} />
            </mesh>
            <mesh position={[0, -0.5, 0.045]} castShadow>
              <boxGeometry args={[0.32, 0.14, 0.49]} />
              <meshStandardMaterial color="#574334" roughness={0.95} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
