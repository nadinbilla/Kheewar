# Optional 3D models for Kheewar

The scene works without any external model files. It will use its built-in stylized cafe and avatar models by default.

You can add licensed GLB/GLTF files here to replace the built-in assets:

## Cafe environment (`cafe.glb` or `cafe.gltf`)
- Place at `public/models/cafe.glb` or `public/models/cafe.gltf`. The `.glb` file is checked first; `.gltf` is used if `.glb` is absent.
- Use meters as the unit; target an approximate footprint of 13 units wide by 12 units deep.
- Put the floor at `y = 0` and leave the front (positive Z) open if the scene is an interior.
- Center the room around `(0, 0, 0)` and orient the entrance toward `+Z`.
- Include materials and textures in the GLB, or keep the `.gltf` external texture/binary files beside it using their expected relative paths.
- Keep texture sizes practical for mobile (generally 1K–2K per texture).
- The GLB should be the complete cafe environment; when detected, it replaces the procedural cafe shell/furniture.

## Avatar (`avatar.glb` or `avatar.gltf`)
- Place at `public/models/avatar.glb` or `public/models/avatar.gltf`. The `.glb` file is checked first; `.gltf` is used if `.glb` is absent.
- Use a rigged humanoid with feet at the origin, facing `+Z`, and approximately 1.7–1.8 units tall.
- Include animation clips named `Idle` and `Walk` (case-insensitive matching is used). If only one clip exists, the app uses the first available clip.
- Use a moderate polygon count and compact textures for mobile.
- The same model is used for each player. User-specific colors remain visible in the profile UI; a model-specific tint/wardrobe system can be added later.

Only add assets whose license explicitly permits the intended use. The optional asset check is local to the deployed Kheewar site; the app does not fetch models from third-party hosts.
