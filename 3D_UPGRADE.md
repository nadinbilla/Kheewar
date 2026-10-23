# Kheewar 3D Upgrade — implementation notes

## Included

- Detailed procedural cafe scene: wood floor seams, windows, Arabic sign/menu boards, counter, espresso machine, pastry display, pendant lamps, tables, chairs, cups, and plants.
- Optional local cafe GLB loading at `public/models/cafe.glb` or `.gltf`, with procedural fallback.
- A bundled stylized hijab avatar at `public/models/avatar.glb`, inspired by the reference image supplied by the user.
- Avatar GLB contains named pivot nodes (`Head`, `Arm_L`, `Arm_R`, `Leg_L`, `Leg_R`). The updated `AnimatedAvatarModel` clones each avatar and provides a simple procedural walk/idle cycle when no baked animation clips are present.
- Camera orbit, pan, zoom, touch movement D-pad, and camera gesture hints.
- Adaptive device pixel ratio and a 1024px directional shadow map as a compromise between visual quality and mobile performance.
- Existing human multiplayer and voice chat code paths are retained; this asset update does not itself validate Supabase/LiveKit connectivity.

## Controls

- Desktop movement: `W`, `A`, `S`, `D` or arrow keys.
- Camera: drag to orbit, scroll to zoom, and use the OrbitControls pan gesture.
- Touch movement: use the on-screen D-pad.
- Touch camera: drag to rotate; pinch to zoom depending on browser/OrbitControls handling.

## Validation status

- GLB exported as glTF 2.0 and reopened with `trimesh` successfully.
- 44 mesh geometries, about 48k triangles, approximately 0.43 MB.
- Named pivot nodes verified: `Head`, `Arm_L`, `Arm_R`, `Leg_L`, `Leg_R`.
- TypeScript syntax for the updated scene was checked with the TypeScript transpiler.
- A full `npm install` / Next.js production build has not been completed in this artifact environment because dependencies are not installed and npm registry DNS access previously failed with `EAI_AGAIN`. Run `npm install` and `npm run build` on the development computer before deploying.

## Model asset limitations

The included avatar is a procedural starter model with stylized geometry and PBR materials. It is not a pixel-perfect replica of the reference image and does not include baked animation clips, face tracking, or visemes. It is suitable for testing the GLB loading pipeline and basic movement. Replace it with a professionally rigged, licensed GLB when a higher-fidelity avatar is ready.
