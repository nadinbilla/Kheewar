# Kheewar 3D Upgrade — Implementation Notes

## What changed

- Rebuilt `components/WorldScene.tsx` around a detailed stylized procedural cafe scene.
- Added wood floor seams, wall windows, Arabic sign/menu boards, counter, espresso machine, pastry display, pendant lamps, tables, chairs, cups, and plants.
- Improved procedural avatars with face features, clothes, limbs, shoes, idle motion, and a simple arm/leg walk cycle.
- Added optional local GLB loading: `public/models/cafe.glb` or `cafe.gltf` replaces the cafe environment; `public/models/avatar.glb` or `avatar.gltf` replaces the procedural avatar and plays `Idle`/`Walk` animation clips when provided.
- Added error fallbacks so missing or invalid model files do not prevent the built-in scene from rendering.
- Made camera orbit azimuth free, enabled pan, retained zoom limits, and enabled damping.
- Added touch D-pad controls for avatar movement and camera gesture hints for touch devices.
- Capped renderer pixel ratio at 1.45, added `AdaptiveDpr` for temporary resolution reduction under interaction load, and kept one 1024px directional shadow map as a compromise between visual quality and mobile performance.
- Added model asset guidance in `public/models/README.md`.
- Updated visible product branding to Kheewar.

## Model requirements

No third-party model file is bundled. Add only assets that you have permission to use. See `public/models/README.md` for the expected origin, orientation, dimensions, animation names, and texture guidance.

## Controls

- Desktop movement: `W`, `A`, `S`, `D` or arrow keys.
- Camera: drag to orbit, scroll to zoom, and use the OrbitControls pan gesture/button.
- Touch movement: use the on-screen D-pad.
- Touch camera: one-finger drag to rotate, pinch to zoom, and two-finger gesture to pan/zoom depending on browser/OrbitControls handling.

## Verification performed in the build workspace

- Parsed all 16 `.ts`/`.tsx` source files using the globally available TypeScript transpiler: syntax passed.
- Parsed `package.json` as JSON: passed.
- Checked global CSS brace counts: balanced.
- A full `npm install` / Next.js production build could not be completed in the build workspace because npm registry DNS resolution failed with `EAI_AGAIN`. This is an environment/network limitation, not a passing production build. Run `npm install` and `npm run build` on the development computer or CI before deploying.

## Local test checklist

1. `npm install`
2. `npm run build`
3. `npm run dev`
4. Open `/world` and check the cafe scene, avatar movement, camera orbit, pan and zoom.
5. Test touch D-pad and camera gestures on a real phone.
6. Add licensed `cafe.glb` and `avatar.glb` files and verify that each model is loaded; remove them to verify procedural fallbacks.
7. Configure Supabase and LiveKit, then test two real users from separate devices. The 3D scene change does not itself configure or prove backend/multiplayer/voice functionality.
