"use client";

import {
  AdaptiveDpr,
  Clone,
  Html,
  OrbitControls,
  PerspectiveCamera,
  useAnimations,
  useGLTF,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import * as THREE from "three";
import type { LocationId, RemoteAvatar } from "@/lib/types";

type WorldPosition = { x: number; z: number };
type MovementState = { current: boolean };
type Props = {
  location: LocationId;
  displayName: string;
  countryFlag: string;
  avatarColor: string;
  remotePlayers: RemoteAvatar[];
  onPositionChange: (position: WorldPosition) => void;
};

type AvatarProps = {
  name: string;
  x: number;
  z: number;
  color: string;
  flag: string;
  isMe?: boolean;
  movementRef?: MovementState;
  avatarModelPath: string | null;
};

const CAFE_MODEL_PATHS = ["/models/cafe.glb", "/models/cafe.gltf"] as const;
const AVATAR_MODEL_PATHS = ["/models/avatar.glb", "/models/avatar.gltf"] as const;

/** Optional local assets are only loaded when the files exist in /public/models. */
function usePublicAssetPath(paths: readonly string[]) {
  const [availablePath, setAvailablePath] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const findAsset = async () => {
      for (const path of paths) {
        try {
          const response = await fetch(path, { method: "HEAD", cache: "no-store" });
          if (response.ok) {
            if (!cancelled) setAvailablePath(path);
            return;
          }
        } catch {
          // A missing or unreachable optional asset should leave the procedural fallback enabled.
        }
      }
      if (!cancelled) setAvailablePath(null);
    };

    void findAsset();
    return () => {
      cancelled = true;
    };
  }, [paths]);

  return availablePath;
}

class ModelErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("Kheewar 3D asset could not be loaded; using the built-in scene.", error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function AvatarNameTag({ name, flag, isMe }: { name: string; flag: string; isMe: boolean }) {
  return (
    <Html position={[0, 2.12, 0]} center distanceFactor={10} zIndexRange={[20, 0]}>
      <div className={`avatar-name-tag ${isMe ? "avatar-name-me" : ""}`}>
        <span>{flag}</span>
        <strong>{name}</strong>
        {isMe && <i>YOU</i>}
      </div>
    </Html>
  );
}

function ProceduralAvatarBody({ color, movementRef }: { color: string; movementRef?: MovementState }) {
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const phase = clock.elapsedTime * 8;
    const walking = Boolean(movementRef?.current);
    const swing = walking ? Math.sin(phase) * 0.48 : Math.sin(clock.elapsedTime * 1.3) * 0.035;
    if (leftArm.current) leftArm.current.rotation.x = swing;
    if (rightArm.current) rightArm.current.rotation.x = -swing;
    if (leftLeg.current) leftLeg.current.rotation.x = walking ? -swing * 0.75 : 0;
    if (rightLeg.current) rightLeg.current.rotation.x = walking ? swing * 0.75 : 0;
  });

  return (
    <group>
      {/* Body and clothing */}
      <mesh position={[0, 0.91, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.285, 0.53, 5, 12]} />
        <meshStandardMaterial color={color} roughness={0.78} />
      </mesh>
      <mesh position={[0, 1.19, 0]} castShadow>
        <sphereGeometry args={[0.285, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.235, 0.015]}>
        <torusGeometry args={[0.105, 0.025, 6, 12]} />
        <meshStandardMaterial color="#f3dfbd" roughness={0.65} />
      </mesh>
      <mesh position={[0, 1.25, 0.005]}>
        <cylinderGeometry args={[0.055, 0.065, 0.12, 10]} />
        <meshStandardMaterial color="#d7a078" roughness={0.9} />
      </mesh>

      {/* Arms are separate pivots so the idle and walk cycles feel alive. */}
      <group ref={leftArm} position={[-0.29, 1.08, 0]}>
        <mesh position={[0, -0.2, 0]} rotation={[0, 0, 0.12]} castShadow>
          <capsuleGeometry args={[0.085, 0.31, 4, 8]} />
          <meshStandardMaterial color={color} roughness={0.82} />
        </mesh>
        <mesh position={[0, -0.405, 0.015]}>
          <sphereGeometry args={[0.078, 12, 10]} />
          <meshStandardMaterial color="#c98f6c" roughness={0.88} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.29, 1.08, 0]}>
        <mesh position={[0, -0.2, 0]} rotation={[0, 0, -0.12]} castShadow>
          <capsuleGeometry args={[0.085, 0.31, 4, 8]} />
          <meshStandardMaterial color={color} roughness={0.82} />
        </mesh>
        <mesh position={[0, -0.405, 0.015]}>
          <sphereGeometry args={[0.078, 12, 10]} />
          <meshStandardMaterial color="#c98f6c" roughness={0.88} />
        </mesh>
      </group>

      {/* Legs and shoes */}
      <group ref={leftLeg} position={[-0.12, 0.53, 0]}>
        <mesh position={[0, -0.17, 0]} castShadow>
          <capsuleGeometry args={[0.105, 0.25, 4, 8]} />
          <meshStandardMaterial color="#35485b" roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.34, 0.055]} castShadow>
          <capsuleGeometry args={[0.09, 0.13, 3, 8]} />
          <meshStandardMaterial color="#f0e9dc" roughness={0.8} />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.12, 0.53, 0]}>
        <mesh position={[0, -0.17, 0]} castShadow>
          <capsuleGeometry args={[0.105, 0.25, 4, 8]} />
          <meshStandardMaterial color="#35485b" roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.34, 0.055]} castShadow>
          <capsuleGeometry args={[0.09, 0.13, 3, 8]} />
          <meshStandardMaterial color="#f0e9dc" roughness={0.8} />
        </mesh>
      </group>

      {/* Neck, face, hair and simple readable facial features */}
      <mesh position={[0, 1.34, 0]}>
        <cylinderGeometry args={[0.09, 0.105, 0.16, 12]} />
        <meshStandardMaterial color="#c98f6c" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.59, 0.015]} castShadow>
        <sphereGeometry args={[0.265, 20, 16]} />
        <meshStandardMaterial color="#d9a17d" roughness={0.86} />
      </mesh>
      <mesh position={[0, 1.71, -0.025]}>
        <sphereGeometry args={[0.27, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#352a25" roughness={0.96} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.092, 1.61, 0.246]}>
            <sphereGeometry args={[0.035, 10, 8]} />
            <meshStandardMaterial color="#fff8ed" roughness={0.45} />
          </mesh>
          <mesh position={[side * 0.092, 1.61, 0.274]}>
            <sphereGeometry args={[0.017, 8, 8]} />
            <meshStandardMaterial color="#302a27" roughness={0.45} />
          </mesh>
          <mesh position={[side * 0.092, 1.665, 0.246]} rotation={[0, 0, side * -0.08]}>
            <boxGeometry args={[0.07, 0.015, 0.018]} />
            <meshStandardMaterial color="#513b30" roughness={0.9} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.55, 0.269]}>
        <sphereGeometry args={[0.027, 8, 8]} />
        <meshStandardMaterial color="#c98f6c" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.49, 0.254]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.042, 0.007, 5, 12, Math.PI]} />
        <meshStandardMaterial color="#70483c" roughness={0.9} />
      </mesh>
    </group>
  );
}

function AnimatedAvatarModel({ path, movementRef }: { path: string; movementRef?: MovementState }) {
  const root = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(path);
  const { actions, names } = useAnimations(animations, root);
  const activeAction = useRef<THREE.AnimationAction | null>(null);
  const model = useMemo(() => scene, [scene]);

  useFrame(() => {
    const wantWalk = Boolean(movementRef?.current);
    const desiredName = wantWalk
      ? names.find((name) => /walk|run|move/i.test(name))
      : names.find((name) => /idle|stand|breath/i.test(name));
    const fallbackName = names[0];
    const nextAction = actions[desiredName ?? fallbackName ?? ""];
    if (nextAction && nextAction !== activeAction.current) {
      activeAction.current?.fadeOut(0.18);
      nextAction.reset().fadeIn(0.18).play();
      activeAction.current = nextAction;
    }
  });

  return (
    <group ref={root}>
      <Clone object={model} />
    </group>
  );
}

function Avatar({ name, x, z, color, flag, isMe = false, movementRef, avatarModelPath }: AvatarProps) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current) {
      const bobAmount = movementRef?.current ? 0.035 : 0.012;
      group.current.position.y = Math.sin(clock.elapsedTime * 2.2 + x * 0.7) * bobAmount;
    }
  });

  return (
    <group ref={group} position={[x, 0, z]}>
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.48, 24]} />
        <meshBasicMaterial color={isMe ? "#73d9ad" : "#f9f1df"} transparent opacity={isMe ? 0.22 : 0.1} />
      </mesh>
      {avatarModelPath ? (
        <ModelErrorBoundary fallback={<ProceduralAvatarBody color={color} movementRef={movementRef} />}>
          <Suspense fallback={<ProceduralAvatarBody color={color} movementRef={movementRef} />}>
            <AnimatedAvatarModel path={avatarModelPath} movementRef={movementRef} />
          </Suspense>
        </ModelErrorBoundary>
      ) : (
        <ProceduralAvatarBody color={color} movementRef={movementRef} />
      )}
      <AvatarNameTag name={name} flag={flag} isMe={isMe} />
      {isMe && (
        <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.49, 0.515, 28]} />
          <meshBasicMaterial color="#57c99a" transparent opacity={0.88} />
        </mesh>
      )}
    </group>
  );
}

function CoffeeCup({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.065, 0]} castShadow>
        <cylinderGeometry args={[0.085, 0.07, 0.13, 12]} />
        <meshStandardMaterial color="#f7f0e4" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.135, 0]}>
        <cylinderGeometry args={[0.071, 0.071, 0.008, 12]} />
        <meshStandardMaterial color="#5c3c2b" roughness={0.35} />
      </mesh>
      <mesh position={[0.09, 0.075, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.035, 0.012, 6, 10]} />
        <meshStandardMaterial color="#f7f0e4" roughness={0.5} />
      </mesh>
    </group>
  );
}

function CafeChair({ position, rotation = 0, color = "#63877b" }: { position: [number, number, number]; rotation?: number; color?: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.46, 0]} castShadow>
        <boxGeometry args={[0.52, 0.12, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.75, -0.2]} castShadow>
        <boxGeometry args={[0.52, 0.55, 0.1]} />
        <meshStandardMaterial color={color} roughness={0.82} />
      </mesh>
      {[-0.2, 0.2].map((x) =>
        [-0.18, 0.18].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.23, z]} castShadow>
            <cylinderGeometry args={[0.027, 0.035, 0.44, 7]} />
            <meshStandardMaterial color="#674934" roughness={0.85} />
          </mesh>
        )),
      )}
    </group>
  );
}

function CafeTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.76, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.62, 0.64, 0.14, 28]} />
        <meshStandardMaterial color="#bd895c" roughness={0.58} />
      </mesh>
      <mesh position={[0, 0.67, 0]}>
        <cylinderGeometry args={[0.53, 0.53, 0.035, 28]} />
        <meshStandardMaterial color="#e0b887" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.105, 0.63, 10]} />
        <meshStandardMaterial color="#674734" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.31, 0.31, 0.08, 18]} />
        <meshStandardMaterial color="#674734" roughness={0.8} />
      </mesh>
      <CoffeeCup position={[-0.2, 0.84, 0.04]} />
      <mesh position={[0.22, 0.84, -0.12]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.12, 16]} />
        <meshStandardMaterial color="#d6e0c8" roughness={0.85} />
      </mesh>
    </group>
  );
}

function Plant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.27, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.34, 0.48, 12]} />
        <meshStandardMaterial color="#bd8661" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.045, 12]} />
        <meshStandardMaterial color="#76513e" roughness={1} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 0.8, 7]} />
        <meshStandardMaterial color="#55774d" roughness={1} />
      </mesh>
      {([
        [-0.22, 0.75, 0.02, -0.45],
        [0.2, 0.88, 0.02, 0.48],
        [-0.18, 1.08, -0.01, -0.55],
        [0.2, 1.19, 0, 0.55],
        [0, 1.35, 0, 0.08],
        [0, 0.98, 0.19, 0.1],
      ] as Array<[number, number, number, number]>).map(([x, y, z, rz], index) => (
        <mesh key={index} position={[x, y, z]} rotation={[0.12, 0, rz]} scale={[0.8, 1.35, 0.42]} castShadow>
          <sphereGeometry args={[0.24, 10, 8]} />
          <meshStandardMaterial color={index % 2 ? "#568566" : "#6d9b72"} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function PendantLamp({ x }: { x: number }) {
  return (
    <group position={[x, 4.42, -3.7]}>
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.7, 6]} />
        <meshStandardMaterial color="#5e4a3c" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.76, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.31, 0.24, 16, 1, true]} />
        <meshStandardMaterial color="#d6aa72" roughness={0.52} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.64, 0]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshStandardMaterial color="#ffe7b3" emissive="#ffc96b" emissiveIntensity={0.65} roughness={0.25} />
      </mesh>
    </group>
  );
}

function CafeWindow({ position, width = 2.1, height = 1.85 }: { position: [number, number, number]; width?: number; height?: number }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[width, height, 0.06]} />
        <meshStandardMaterial color="#8fc4ca" emissive="#9dd5dc" emissiveIntensity={0.12} roughness={0.28} metalness={0.05} />
      </mesh>
      {[-width / 2, 0, width / 2].map((x) => (
        <mesh key={x} position={[x, 0, 0.045]}>
          <boxGeometry args={[0.075, height + 0.12, 0.12]} />
          <meshStandardMaterial color="#805a43" roughness={0.78} />
        </mesh>
      ))}
      {[-height / 2, height / 2].map((y) => (
        <mesh key={y} position={[0, y, 0.045]}>
          <boxGeometry args={[width + 0.12, 0.075, 0.12]} />
          <meshStandardMaterial color="#805a43" roughness={0.78} />
        </mesh>
      ))}
    </group>
  );
}

function CafeSign() {
  return (
    <group position={[0, 4.05, -5.48]}>
      <mesh castShadow>
        <boxGeometry args={[3.2, 0.64, 0.14]} />
        <meshStandardMaterial color="#315849" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.08]}>
        <boxGeometry args={[3.02, 0.48, 0.025]} />
        <meshStandardMaterial color="#3c6a56" roughness={0.75} />
      </mesh>
      <Html position={[0, 0.01, 0.105]} transform center distanceFactor={7}>
        <div className="kheewar-cafe-sign" dir="rtl">مَقْهَى خِوَار</div>
      </Html>
    </group>
  );
}

function CafeMenuBoard({ x, title, items }: { x: number; title: string; items: string[] }) {
  return (
    <group position={[x, 3.02, -5.48]}>
      <mesh castShadow>
        <boxGeometry args={[1.58, 1.05, 0.12]} />
        <meshStandardMaterial color="#283d32" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0, 0.07]}>
        <boxGeometry args={[1.45, 0.91, 0.02]} />
        <meshStandardMaterial color="#304b3d" roughness={1} />
      </mesh>
      <Html position={[0, 0.01, 0.09]} transform center distanceFactor={5.5}>
        <div className="kheewar-menu-board" dir="rtl">
          <strong>{title}</strong>
          {items.map((item) => <span key={item}>{item}</span>)}
        </div>
      </Html>
    </group>
  );
}

function CafeCounter() {
  return (
    <group position={[0, 0, -4.48]}>
      <mesh position={[0, 0.61, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.45, 1.18, 0.76]} />
        <meshStandardMaterial color="#456b58" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.61, 0.395]}>
        <boxGeometry args={[5.25, 0.88, 0.045]} />
        <meshStandardMaterial color="#527d65" roughness={0.82} />
      </mesh>
      {[-1.75, -0.6, 0.6, 1.75].map((x) => (
        <mesh key={x} position={[x, 0.62, 0.425]}>
          <boxGeometry args={[0.035, 0.7, 0.025]} />
          <meshStandardMaterial color="#c69a68" roughness={0.65} />
        </mesh>
      ))}
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[5.68, 0.14, 0.92]} />
        <meshStandardMaterial color="#d5ad7e" roughness={0.52} />
      </mesh>
      <mesh position={[0, 1.33, 0.01]}>
        <boxGeometry args={[5.55, 0.035, 0.84]} />
        <meshStandardMaterial color="#f0d6ad" roughness={0.48} />
      </mesh>

      {/* Espresso machine and coffee equipment */}
      <group position={[-0.95, 1.34, -0.12]}>
        <mesh position={[0, 0.34, 0]} castShadow>
          <boxGeometry args={[1.08, 0.62, 0.42]} />
          <meshStandardMaterial color="#a9b4b1" metalness={0.38} roughness={0.38} />
        </mesh>
        <mesh position={[0, 0.17, 0.22]}>
          <boxGeometry args={[1.1, 0.09, 0.5]} />
          <meshStandardMaterial color="#596963" metalness={0.2} roughness={0.45} />
        </mesh>
        {[-0.28, 0, 0.28].map((x) => (
          <mesh key={x} position={[x, 0.42, 0.22]}>
            <cylinderGeometry args={[0.045, 0.045, 0.035, 10]} />
            <meshStandardMaterial color="#e6bd70" metalness={0.3} roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[0.48, 0.4, 0.13]}>
          <boxGeometry args={[0.08, 0.23, 0.08]} />
          <meshStandardMaterial color="#3e4e49" roughness={0.5} />
        </mesh>
      </group>

      {/* Pastry display */}
      <group position={[1.25, 1.34, 0.02]}>
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[1.25, 0.06, 0.52]} />
          <meshStandardMaterial color="#e4c99e" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.43, -0.02]}>
          <boxGeometry args={[1.2, 0.38, 0.46]} />
          <meshStandardMaterial color="#c6e2df" transparent opacity={0.3} roughness={0.18} metalness={0.08} />
        </mesh>
        {[-0.34, 0, 0.34].map((x, index) => (
          <mesh key={x} position={[x, 0.28, 0.02]} rotation={[0, index * 0.5, 0]}>
            <torusGeometry args={[0.095, 0.035, 6, 12]} />
            <meshStandardMaterial color={index === 1 ? "#c67d48" : "#e5b86b"} roughness={0.78} />
          </mesh>
        ))}
      </group>
      {[-2.2, 2.2].map((x) => <CoffeeCup key={x} position={[x, 1.34, 0.12]} />)}
    </group>
  );
}

function ProceduralCafe() {
  return (
    <group>
      {/* Warm wood floor and fine plank seams */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[13, 12]} />
        <meshStandardMaterial color="#cda77e" roughness={0.86} />
      </mesh>
      {Array.from({ length: 15 }, (_, index) => {
        const z = -5.4 + index * 0.76;
        return (
          <mesh key={`floor-${index}`} position={[0, -0.066, z]}>
            <boxGeometry args={[12.85, 0.008, 0.018]} />
            <meshStandardMaterial color="#a97f5b" roughness={1} />
          </mesh>
        );
      })}
      {Array.from({ length: 8 }, (_, index) => {
        const x = -5.6 + index * 1.6;
        return (
          <mesh key={`joint-${index}`} position={[x, -0.064, -2.8 + (index % 2) * 0.38]}>
            <boxGeometry args={[0.018, 0.008, 5.2]} />
            <meshStandardMaterial color="#b58b66" roughness={1} />
          </mesh>
        );
      })}

      {/* Three walls; front remains open for a clear game camera */}
      <mesh position={[0, 2.35, -5.72]} receiveShadow>
        <boxGeometry args={[13, 4.75, 0.24]} />
        <meshStandardMaterial color="#f0dfc5" roughness={0.94} />
      </mesh>
      <mesh position={[-6.38, 2.35, 0]} receiveShadow>
        <boxGeometry args={[0.24, 4.75, 11.6]} />
        <meshStandardMaterial color="#ead7ba" roughness={0.92} />
      </mesh>
      <mesh position={[6.38, 2.35, 0]} receiveShadow>
        <boxGeometry args={[0.24, 4.75, 11.6]} />
        <meshStandardMaterial color="#ead7ba" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.13, -5.54]}>
        <boxGeometry args={[12.75, 0.22, 0.12]} />
        <meshStandardMaterial color="#9b7354" roughness={0.8} />
      </mesh>
      <mesh position={[-6.22, 0.13, 0]}>
        <boxGeometry args={[0.12, 0.22, 11.4]} />
        <meshStandardMaterial color="#9b7354" roughness={0.8} />
      </mesh>
      <mesh position={[6.22, 0.13, 0]}>
        <boxGeometry args={[0.12, 0.22, 11.4]} />
        <meshStandardMaterial color="#9b7354" roughness={0.8} />
      </mesh>

      {/* Back-wall windows with timber frames */}
      <CafeWindow position={[-4.55, 2.72, -5.56]} width={2.35} height={1.95} />
      <CafeWindow position={[4.55, 2.72, -5.56]} width={2.35} height={1.95} />
      <mesh position={[-4.55, 2.72, -5.47]}>
        <boxGeometry args={[2.16, 0.055, 0.035]} />
        <meshStandardMaterial color="#f3d9b4" roughness={0.7} />
      </mesh>
      <mesh position={[4.55, 2.72, -5.47]}>
        <boxGeometry args={[2.16, 0.055, 0.035]} />
        <meshStandardMaterial color="#f3d9b4" roughness={0.7} />
      </mesh>

      <CafeSign />
      <CafeMenuBoard x={-1.7} title="قائمة المقهى" items={["قهوة عربية", "شاي بالنعناع", "كعك طازج"]} />
      <CafeMenuBoard x={1.7} title="أهلاً وسهلاً" items={["تفضّل", "ماذا تريد؟", "شكراً لك"]} />
      <CafeCounter />
      {[-2.1, 0, 2.1].map((x) => <PendantLamp key={x} x={x} />)}

      {/* Seating is arranged around the walking lane, leaving room for avatars. */}
      <CafeTable position={[-3.05, 0, -0.1]} />
      <CafeChair position={[-3.05, 0, 0.92]} rotation={Math.PI} />
      <CafeChair position={[-4.05, 0, -0.1]} rotation={Math.PI / 2} color="#7e9a78" />
      <CafeTable position={[3.05, 0, -0.1]} />
      <CafeChair position={[3.05, 0, 0.92]} rotation={Math.PI} />
      <CafeChair position={[4.05, 0, -0.1]} rotation={-Math.PI / 2} color="#7e9a78" />
      <CafeTable position={[-3.05, 0, 2.75]} />
      <CafeChair position={[-3.05, 0, 3.72]} rotation={Math.PI} color="#b57d63" />
      <CafeTable position={[3.05, 0, 2.75]} />
      <CafeChair position={[3.05, 0, 3.72]} rotation={Math.PI} color="#b57d63" />

      <Plant position={[-5.45, 0, -4.35]} scale={1.1} />
      <Plant position={[5.45, 0, -4.35]} scale={1.1} />
      <Plant position={[-5.35, 0, 4.45]} scale={0.92} />
      <Plant position={[5.35, 0, 4.45]} scale={0.92} />
    </group>
  );
}

function CafeGLBModel({ path }: { path: string }) {
  const { scene } = useGLTF(path);
  const model = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return cloned;
  }, [scene]);
  return <primitive object={model} dispose={null} />;
}

function CafeEnvironment({ cafeModelPath }: { cafeModelPath: string | null }) {
  if (!cafeModelPath) return <ProceduralCafe />;
  return (
    <ModelErrorBoundary fallback={<ProceduralCafe />}>
      <Suspense fallback={<ProceduralCafe />}>
        <CafeGLBModel path={cafeModelPath} />
      </Suspense>
    </ModelErrorBoundary>
  );
}

function HomeFurniture() {
  return <group><mesh position={[0, 0.45, -2.7]} castShadow><boxGeometry args={[3.4, 0.9, 0.8]} /><meshStandardMaterial color="#668a87" roughness={0.8} /></mesh><mesh position={[0, 0.94, -2.7]}><boxGeometry args={[3.5, 0.16, 0.85]} /><meshStandardMaterial color="#91b1a9" roughness={0.75} /></mesh><mesh position={[0, 0.48, -0.5]}><boxGeometry args={[1.8, 0.12, 0.9]} /><meshStandardMaterial color="#b88962" roughness={0.8} /></mesh>{[-0.7, 0.7].map((x) => <mesh key={x} position={[x, 0.24, -0.5]}><boxGeometry args={[0.08, 0.48, 0.08]} /><meshStandardMaterial color="#79563e" roughness={0.85} /></mesh>)}</group>;
}
function OfficeFurniture() {
  return <group>{[-2, 0, 2].map((x) => <group key={x} position={[x, 0, -2]}><mesh position={[0, 0.95, 0]} castShadow><boxGeometry args={[1.55, 0.12, 0.8]} /><meshStandardMaterial color="#8e9db2" roughness={0.75} /></mesh><mesh position={[0, 0.5, 0]}><boxGeometry args={[0.08, 0.9, 0.08]} /><meshStandardMaterial color="#49596b" roughness={0.85} /></mesh><mesh position={[0, 1.13, -0.08]}><boxGeometry args={[0.7, 0.04, 0.45]} /><meshStandardMaterial color="#293b4b" roughness={0.7} /></mesh></group>)}</group>;
}
function CampusFurniture() {
  return <group>{[-2.5, 2.5].map((x) => <group key={x} position={[x, 0, -2]}><mesh position={[0, 0.5, 0]}><boxGeometry args={[2.1, 0.14, 0.5]} /><meshStandardMaterial color="#b88c62" roughness={0.8} /></mesh>{[-0.8, 0.8].map((dx) => <mesh key={dx} position={[dx, 0.25, 0]}><boxGeometry args={[0.12, 0.5, 0.4]} /><meshStandardMaterial color="#775c45" roughness={0.85} /></mesh>)}</group>)}<mesh position={[0, 0.6, -3.6]}><cylinderGeometry args={[0.1, 0.12, 1.2, 8]} /><meshStandardMaterial color="#846044" /></mesh><mesh position={[0, 1.45, -3.6]}><sphereGeometry args={[0.8, 12, 12]} /><meshStandardMaterial color="#6eaa80" roughness={0.95} /></mesh></group>;
}
function MarketFurniture() {
  return <group>{[-2.6, 0, 2.6].map((x, i) => <group key={x} position={[x, 0, -2.6]}><mesh position={[0, 0.85, 0]}><boxGeometry args={[1.8, 0.12, 1.1]} /><meshStandardMaterial color={i === 1 ? "#bf7b62" : "#d7a56c"} roughness={0.8} /></mesh><mesh position={[0, 1.5, 0]}><boxGeometry args={[1.95, 0.08, 1.25]} /><meshStandardMaterial color={i === 1 ? "#7d9b80" : "#d99a75"} roughness={0.8} /></mesh>{[-0.5, 0, 0.5].map((dx, j) => <mesh key={dx} position={[dx, 1.05, 0.05]}><sphereGeometry args={[0.16, 10, 8]} /><meshStandardMaterial color={["#e6b84f", "#c76f55", "#77a76c"][j]} roughness={0.8} /></mesh>)}</group>)}</group>;
}

function OtherEnvironment({ location }: { location: Exclude<LocationId, "cafe"> }) {
  const floorColor = location === "campus" ? "#d6d8b4" : location === "market" ? "#d7c4a4" : location === "office" ? "#d2d9de" : "#d9c9b5";
  const wallColor = location === "campus" ? "#dce8d6" : location === "office" ? "#dfe5ec" : location === "home" ? "#e9ded0" : "#e7d7b7";
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, 0]} receiveShadow>
        <planeGeometry args={[13, 12]} />
        <meshStandardMaterial color={floorColor} roughness={0.92} />
      </mesh>
      <mesh position={[0, 2.4, -5.7]} receiveShadow>
        <boxGeometry args={[13, 4.9, 0.22]} />
        <meshStandardMaterial color={wallColor} roughness={0.94} />
      </mesh>
      <mesh position={[-6.4, 2.4, 0]}>
        <boxGeometry args={[0.22, 4.9, 11.5]} />
        <meshStandardMaterial color={wallColor} roughness={0.94} />
      </mesh>
      <mesh position={[6.4, 2.4, 0]}>
        <boxGeometry args={[0.22, 4.9, 11.5]} />
        <meshStandardMaterial color={wallColor} roughness={0.94} />
      </mesh>
      {location === "home" && <HomeFurniture />}
      {location === "office" && <OfficeFurniture />}
      {location === "campus" && <CampusFurniture />}
      {location === "market" && <MarketFurniture />}
    </group>
  );
}

function PlayerController({ displayName, countryFlag, avatarColor, onPositionChange, avatarModelPath }: { displayName: string; countryFlag: string; avatarColor: string; onPositionChange: Props["onPositionChange"]; avatarModelPath: string | null }) {
  const group = useRef<THREE.Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const moving = useRef(false);
  const lastSent = useRef(0);

  useEffect(() => {
    const movementKeys = ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"];
    const down = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const key = event.key.toLowerCase();
      if (movementKeys.includes(key)) {
        keys.current[key] = true;
        if (key.startsWith("arrow")) event.preventDefault();
      }
    };
    const up = (event: KeyboardEvent) => { keys.current[event.key.toLowerCase()] = false; };
    const touchMove = (event: Event) => {
      const custom = event as CustomEvent<{ key: string; pressed: boolean }>;
      if (!custom.detail) return;
      keys.current[custom.detail.key] = custom.detail.pressed;
    };
    const clear = () => {
      Object.keys(keys.current).forEach((key) => { keys.current[key] = false; });
    };
    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    window.addEventListener("kheewar:movement", touchMove);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("kheewar:movement", touchMove);
      window.removeEventListener("blur", clear);
    };
  }, []);

  useFrame((_, delta) => {
    if (!group.current) return;
    const k = keys.current;
    const dx = (k.d || k.arrowright ? 1 : 0) - (k.a || k.arrowleft ? 1 : 0);
    const dz = (k.s || k.arrowdown ? 1 : 0) - (k.w || k.arrowup ? 1 : 0);
    moving.current = Boolean(dx || dz);

    if (dx || dz) {
      const length = Math.hypot(dx, dz) || 1;
      group.current.position.x = THREE.MathUtils.clamp(group.current.position.x + (dx / length) * delta * 2.7, -4.85, 4.85);
      group.current.position.z = THREE.MathUtils.clamp(group.current.position.z + (dz / length) * delta * 2.7, -4.4, 4.25);
      group.current.rotation.y = Math.atan2(dx, dz || 0.0001);
      const now = performance.now();
      if (now - lastSent.current > 160) {
        lastSent.current = now;
        onPositionChange({ x: Number(group.current.position.x.toFixed(2)), z: Number(group.current.position.z.toFixed(2)) });
      }
    }
  });

  return (
    <group ref={group} position={[0, 0, 2]}>
      <Avatar name={displayName} x={0} z={0} color={avatarColor} flag={countryFlag} isMe movementRef={moving} avatarModelPath={avatarModelPath} />
    </group>
  );
}

function SceneContents({ location, displayName, countryFlag, avatarColor, remotePlayers, onPositionChange }: Props) {
  const cafeModelPath = usePublicAssetPath(CAFE_MODEL_PATHS);
  const avatarModelPath = usePublicAssetPath(AVATAR_MODEL_PATHS);

  return (
    <>
      <color attach="background" args={[location === "cafe" ? "#d8e4df" : "#e8e3d9"]} />
      <fog attach="fog" args={[location === "cafe" ? "#d8e4df" : "#e8e3d9", 17, 31]} />
      <ambientLight intensity={0.48} />
      <hemisphereLight args={["#f4f5eb", "#7d6b56", 0.92]} />
      <directionalLight
        position={[-5, 10, 6]}
        intensity={2.05}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={28}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.00015}
        shadow-normalBias={0.035}
      />
      <PerspectiveCamera makeDefault position={[8.7, 8.6, 10.5]} fov={43} near={0.1} far={70} />
      <OrbitControls
        makeDefault
        target={[0, 0.9, 0]}
        enablePan
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.68}
        panSpeed={0.62}
        zoomSpeed={0.72}
        screenSpacePanning
        minDistance={5.5}
        maxDistance={19}
        minPolarAngle={0.22}
        maxPolarAngle={1.48}
      />
      {location === "cafe" ? <CafeEnvironment cafeModelPath={cafeModelPath} /> : <OtherEnvironment location={location} />}
      <PlayerController
        displayName={displayName}
        countryFlag={countryFlag}
        avatarColor={avatarColor}
        onPositionChange={onPositionChange}
        avatarModelPath={avatarModelPath}
      />
      {remotePlayers.map((player) => (
        <Avatar
          key={player.id}
          name={player.name}
          x={player.x}
          z={player.z}
          color={player.color ?? "#8a9de0"}
          flag={player.country_code === "ID" ? "🇮🇩" : player.country_code === "EG" ? "🇪🇬" : player.country_code === "SA" ? "🇸🇦" : "🌐"}
          avatarModelPath={avatarModelPath}
        />
      ))}
    </>
  );
}

function setTouchMovement(key: string, pressed: boolean) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("kheewar:movement", { detail: { key, pressed } }));
  }
}

function TouchButton({ keyName, label, className = "" }: { keyName: string; label: string; className?: string }) {
  const press = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setTouchMovement(keyName, true);
  };
  const release = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setTouchMovement(keyName, false);
  };
  return (
    <button
      type="button"
      className={`scene-touch-button ${className}`}
      aria-label={label}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={() => setTouchMovement(keyName, false)}
      onContextMenu={(event) => event.preventDefault()}
    >
      {label === "Atas" ? "▲" : label === "Bawah" ? "▼" : label === "Kiri" ? "◀" : "▶"}
    </button>
  );
}

export default function WorldScene(props: Props) {
  return (
    <div className="kheewar-scene-canvas">
      <Canvas
        shadows
        dpr={[1, 1.45]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        camera={{ position: [8.7, 8.6, 10.5], fov: 43 }}
        performance={{ min: 0.55 }}
      >
        <AdaptiveDpr pixelated />
        <Suspense fallback={null}>
          <SceneContents {...props} />
        </Suspense>
      </Canvas>
      <div className="scene-touch-controls" aria-label="Kontrol gerak avatar">
        <TouchButton keyName="w" label="Atas" className="touch-up" />
        <TouchButton keyName="a" label="Kiri" className="touch-left" />
        <TouchButton keyName="s" label="Bawah" className="touch-down" />
        <TouchButton keyName="d" label="Kanan" className="touch-right" />
      </div>
      <div className="scene-camera-hint" aria-hidden="true">Geser untuk memutar · Cubit untuk zoom</div>
    </div>
  );
}
