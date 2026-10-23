# Kheewar avatar starter — quick test

This bundle adds a stylized 3D hijab avatar to the existing Next.js + React Three Fiber Kheewar project. It keeps the current world scene, avatar names/flags, remote player positions, and voice chat integration. It does not change Supabase or LiveKit configuration.

## Fastest way to try it in your existing Kheewar repository

1. Back up the current repository / make a Git branch first.
2. Copy `public/models/avatar.glb` from this bundle into your repository at `public/models/avatar.glb`.
3. The WorldScene version in the Kheewar source snapshot already checks for `/models/avatar.glb`; when that file is present, it loads it instead of the procedural placeholder.
4. Run:

   ```powershell
   npm install
   npm run dev
   ```

5. Open `http://localhost:3000/world`. Check the avatar, drag the mouse to orbit the camera, scroll to zoom, and use WASD to move.

## Procedural limb animation patch

The updated `components/WorldScene.tsx` in this bundle clones the GLB per avatar and animates its named pivot nodes (`Arm_L`, `Arm_R`, `Leg_L`, `Leg_R`, `Head`) if the GLB has no baked clips. If your current repository's `WorldScene.tsx` has diverged, do not overwrite it blindly: compare the `AnimatedAvatarModel` function and merge that change manually.

## Test on the actual web app

- Check that `/models/avatar.glb` returns HTTP 200 in the browser's Network tab.
- Check `/world` at desktop width and mobile width.
- Verify camera orbit, zoom, and avatar movement.
- Test with two signed-in users in the same room to ensure both local and remote avatars render.
- Verify voice chat separately: this visual model does not configure LiveKit or prove the audio backend is working.
- Run `npm run build` before pushing/deploying.

## Asset notes and limitations

- This is a starter 3D model made from procedural meshes/materials, inspired by the reference style. It is not an exact replica and has no facial expression/viseme system.
- The model is currently the same hijab avatar for every user; separate male/female options and wardrobe customization are later work.
- The walk cycle is a lightweight pivot animation, not a full motion-capture rig. A professionally rigged GLB can replace it later.
- The model file is approximately 0.43 MB and about 48k triangles. Test with several users on a real mid-range phone before increasing detail.
- A full production build was not run in this artifact environment because the project dependencies are not installed here and npm registry access previously failed with a DNS error. Run `npm install` and `npm run build` on your computer to confirm the full build.
