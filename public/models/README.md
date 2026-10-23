# Kheewar 3D model assets

## Included starter avatar

`avatar.glb` is a lightweight, procedural stylized hijab avatar created for the Kheewar prototype. It is inspired by the visual style of the reference supplied in the conversation; it is not a one-to-one conversion of that image and is not intended to be the final production character.

- Format: GLB / glTF 2.0
- Approximate height: 1.95 world units, feet near `y = 0`
- Faces toward `+Z`
- Includes named pivot nodes: `Head`, `Arm_L`, `Arm_R`, `Leg_L`, `Leg_R`
- The web scene can animate the pivots procedurally when the model has no baked animation clips.
- Approximately 48k triangles; around 0.43 MB, before any additional CDN compression.

## Optional cafe environment

You can add a licensed cafe model at `public/models/cafe.glb` or `public/models/cafe.gltf`. The `.glb` file is checked first. If present, it replaces the procedural cafe shell/furniture.

For a cafe GLB:
- Use meters as the unit; target an approximate footprint of 13 units wide by 12 units deep.
- Put the floor at `y = 0` and leave the front (`+Z`) open if the scene is an interior.
- Center the room around `(0, 0, 0)` and orient the entrance toward `+Z`.
- Include materials and textures in the GLB, or keep `.gltf` external texture/binary files beside it using their expected relative paths.
- Keep texture sizes practical for mobile (generally 1K–2K per texture).

## Replacing the starter avatar

Use a rigged humanoid GLB if you need more natural walk, idle, and gesture animations. For the existing scene, place it at `public/models/avatar.glb`. The scene looks for clips named `Idle` and `Walk` (case-insensitive matching); if no clips exist, the included starter model uses its named pivots for a simple procedural walk/idle cycle.

Only add assets whose license explicitly permits the intended use. The scene does not fetch models from third-party hosts at runtime.
