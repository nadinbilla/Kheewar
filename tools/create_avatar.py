#!/usr/bin/env python3
"""Generate a lightweight stylized hijab avatar GLB for Kheewar.

This is a procedural starter asset inspired by the user's reference image.
It is original geometry, not a conversion of the reference image into 3D.
Requires: trimesh, numpy.
"""
from __future__ import annotations
import math
from pathlib import Path
import numpy as np
import trimesh

OUT = Path(__file__).resolve().parents[1] / "public" / "models" / "avatar.glb"

# GLTF PBR materials use normalized (0..1) RGBA values.
def material(name, color, roughness=0.78, metallic=0.0, double_sided=False):
    rgba = [int(color[i:i+2], 16) / 255.0 for i in (1, 3, 5)] + [1.0]
    return trimesh.visual.material.PBRMaterial(
        name=name,
        baseColorFactor=rgba,
        roughnessFactor=roughness,
        metallicFactor=metallic,
        doubleSided=double_sided,
    )

M = {
    "hijab": material("Midnight navy hijab", "#182536", 0.86),
    "hijab_light": material("Hijab soft folds", "#29394c", 0.9),
    "hijab_seam": material("Hijab seam", "#405267", 0.92),
    "skin": material("Warm peach skin", "#e6b39b", 0.82),
    "skin_light": material("Skin highlights", "#f4c9b3", 0.72),
    "blush": material("Soft cheek blush", "#d88986", 0.9),
    "abaya": material("Charcoal navy abaya", "#202c3c", 0.9),
    "abaya_light": material("Abaya folds", "#2c3b4d", 0.92),
    "eye_white": material("Eye whites", "#fff8f0", 0.32),
    "iris": material("Warm brown iris", "#80503a", 0.4),
    "pupil": material("Pupils", "#211b1b", 0.28),
    "shine": material("Eye catchlights", "#ffffff", 0.18),
    "brow": material("Brows and lashes", "#30252a", 0.9),
    "mouth": material("Smile", "#6d3c3b", 0.85),
    "teeth": material("Teeth", "#fff6e8", 0.5),
    "shoe": material("Shoes", "#151d28", 0.82),
    "button": material("Abaya buttons", "#87909a", 0.55, 0.15),
}

scene = trimesh.Scene()


def add_pivot(name: str, position):
    T = np.eye(4)
    T[:3, 3] = np.asarray(position, dtype=float)
    scene.graph.update(frame_to=name, matrix=T, parent_node="world")


def add_mesh(name: str, mesh: trimesh.Trimesh, mat, parent: str | None = None, transform=None):
    mesh.visual.material = mat
    mesh.metadata["name"] = name
    scene.add_geometry(
        mesh,
        node_name=name,
        geom_name=name + "_geometry",
        parent_node_name=parent,
        transform=np.eye(4) if transform is None else transform,
    )


def ellipsoid(center, scale, mat, name="ellipsoid", parent=None, rotation=None, subdivisions=3, count=(24, 16)):
    mesh = trimesh.creation.uv_sphere(radius=1.0, count=list(count))
    mesh.apply_scale(np.asarray(scale, dtype=float))
    if rotation is not None:
        mesh.apply_transform(rotation)
    mesh.apply_translation(np.asarray(center, dtype=float))
    add_mesh(name, mesh, mat, parent)
    return mesh


def capsule_between(a, b, radius, mat, name, parent=None):
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    vec = b - a
    length = np.linalg.norm(vec)
    if length < 1e-5:
        return ellipsoid(a, [radius, radius, radius], mat, name, parent)
    mesh = trimesh.creation.capsule(height=max(0.001, length - 2 * radius), radius=radius, count=[12, 12])
    # trimesh capsule's long axis is Y. Rotate Y toward the segment vector.
    direction = vec / length
    q = trimesh.geometry.align_vectors([0, 1, 0], direction)
    mesh.apply_transform(q)
    mesh.apply_translation((a + b) / 2)
    add_mesh(name, mesh, mat, parent)
    return mesh


def tube(points, radius, mat, name, parent=None, sides=8):
    pts = np.asarray(points, dtype=float)
    verts, faces = [], []
    for i, p in enumerate(pts):
        if i == 0:
            tangent = pts[1] - pts[0]
        elif i == len(pts) - 1:
            tangent = pts[-1] - pts[-2]
        else:
            tangent = pts[i + 1] - pts[i - 1]
        tangent = tangent / (np.linalg.norm(tangent) + 1e-9)
        ref = np.array([0.0, 0.0, 1.0])
        if abs(np.dot(tangent, ref)) > 0.92:
            ref = np.array([0.0, 1.0, 0.0])
        n = np.cross(tangent, ref)
        n /= np.linalg.norm(n) + 1e-9
        b = np.cross(tangent, n)
        b /= np.linalg.norm(b) + 1e-9
        for j in range(sides):
            ang = 2 * math.pi * j / sides
            verts.append(p + radius * (math.cos(ang) * n + math.sin(ang) * b))
    for i in range(len(pts) - 1):
        for j in range(sides):
            a = i * sides + j
            b = i * sides + (j + 1) % sides
            c = (i + 1) * sides + (j + 1) % sides
            d = (i + 1) * sides + j
            faces.extend([[a, b, c], [a, c, d]])
    mesh = trimesh.Trimesh(vertices=np.asarray(verts), faces=np.asarray(faces), process=True)
    mesh.fix_normals()
    add_mesh(name, mesh, mat, parent)
    return mesh


def ring_body(rings, mat, name, segments=48):
    verts, faces = [], []
    for y, rx, rz, zc in rings:
        for j in range(segments):
            a = 2 * math.pi * j / segments
            verts.append([rx * math.cos(a), y, zc + rz * math.sin(a)])
    for i in range(len(rings) - 1):
        for j in range(segments):
            a = i * segments + j
            b = i * segments + (j + 1) % segments
            c = (i + 1) * segments + (j + 1) % segments
            d = (i + 1) * segments + j
            faces.extend([[a, d, c], [a, c, b]])
    # close top and bottom
    bottom = len(verts)
    verts.append([0, rings[0][0], rings[0][3]])
    top = len(verts)
    verts.append([0, rings[-1][0], rings[-1][3]])
    for j in range(segments):
        faces.append([bottom, (j + 1) % segments, j])
        base = (len(rings) - 1) * segments
        faces.append([top, base + j, base + (j + 1) % segments])
    mesh = trimesh.Trimesh(vertices=np.asarray(verts), faces=np.asarray(faces), process=True)
    mesh.fix_normals()
    add_mesh(name, mesh, mat)
    return mesh


def scarf_patch():
    # A curved triangular cloth panel over the chest, front-facing (+Z).
    rows, cols = 15, 24
    verts, faces = [], []
    for ri in range(rows + 1):
        t = ri / rows
        left_x = -0.245 * (1 - t) - 0.085 * t
        right_x = 0.22 * (1 - t) - 0.085 * t
        y = 1.24 * (1 - t) + 0.61 * t
        for ci in range(cols + 1):
            u = ci / cols
            x = left_x * (1 - u) + right_x * u
            # Soft fabric bulge toward camera, with a slight asymmetric drape.
            z = 0.225 + 0.055 * math.sin(math.pi * t) * (1 - (2 * u - 1) ** 2) + 0.012 * u
            verts.append([x, y + 0.025 * math.sin(math.pi * u) * math.sin(math.pi * t), z])
    for ri in range(rows):
        for ci in range(cols):
            a = ri * (cols + 1) + ci
            b = a + 1
            c = a + (cols + 1) + 1
            d = a + (cols + 1)
            faces.extend([[a, c, b], [a, d, c]])
    mesh = trimesh.Trimesh(vertices=np.asarray(verts), faces=np.asarray(faces), process=True)
    mesh.fix_normals()
    # This is an open cloth surface: ensure its visible face points toward +Z.
    if float(np.mean(mesh.face_normals[:, 2])) < 0:
        mesh.invert()
    add_mesh("HijabChestDrape", mesh, M["hijab_light"])


# ---- Body and modest abaya ----
ring_body([
    (0.12, 0.27, 0.16, 0.0),
    (0.20, 0.34, 0.18, 0.0),
    (0.38, 0.35, 0.18, 0.0),
    (0.58, 0.32, 0.17, 0.0),
    (0.78, 0.29, 0.155, 0.0),
    (0.98, 0.31, 0.17, 0.0),
    (1.12, 0.285, 0.15, 0.0),
    (1.19, 0.22, 0.13, 0.0),
], M["abaya"], "AbayaTorso")

# subtle shoulder/side folds on the robe
for side in (-1, 1):
    tube([[side * 0.25, 1.02, 0.135], [side * 0.28, 0.83, 0.15], [side * 0.29, 0.61, 0.15], [side * 0.30, 0.39, 0.15]], 0.008, M["abaya_light"], f"AbayaFold_{'L' if side < 0 else 'R'}")

# Arms are pivoted separately for a simple walk cycle in React Three Fiber.
for side, pivot_name, suffix in [(-1, "Arm_L", "L"), (1, "Arm_R", "R")]:
    pivot = [side * 0.275, 1.09, 0.015]
    add_pivot(pivot_name, pivot)
    # local coordinates: sleeves hang from shoulder, slightly away from the torso
    sleeve = trimesh.creation.uv_sphere(radius=1, count=[28, 20])
    sleeve.apply_scale([0.082, 0.315, 0.087])
    sleeve.apply_transform(trimesh.transformations.rotation_matrix(side * -0.12, [0, 0, 1]))
    sleeve.apply_translation([side * 0.045, -0.275, 0.018])
    add_mesh(f"Arm_{suffix}_Sleeve", sleeve, M["abaya"], parent=pivot_name)
    hand = trimesh.creation.uv_sphere(radius=1, count=[20, 16])
    hand.apply_scale([0.058, 0.067, 0.054])
    hand.apply_translation([side * 0.075, -0.535, 0.035])
    add_mesh(f"Arm_{suffix}_Hand", hand, M["skin"], parent=pivot_name)
    # sleeve cuff seam
    tube([[side * 0.025, -0.455, 0.075], [side * 0.065, -0.45, 0.075], [side * 0.10, -0.44, 0.07]], 0.006, M["abaya_light"], f"Arm_{suffix}_Cuff", parent=pivot_name)

# Legs and shoes under the abaya; pivot names are used by the procedural walk cycle.
for side, pivot_name, suffix in [(-1, "Leg_L", "L"), (1, "Leg_R", "R")]:
    pivot = [side * 0.115, 0.46, 0.0]
    add_pivot(pivot_name, pivot)
    leg = trimesh.creation.uv_sphere(radius=1, count=[24, 18])
    leg.apply_scale([0.092, 0.30, 0.105])
    leg.apply_translation([0, -0.19, 0.0])
    add_mesh(f"Leg_{suffix}_Trouser", leg, M["abaya"], parent=pivot_name)
    shoe = trimesh.creation.uv_sphere(radius=1, count=[24, 16])
    shoe.apply_scale([0.102, 0.07, 0.16])
    shoe.apply_translation([0, -0.425, 0.055])
    add_mesh(f"Leg_{suffix}_Shoe", shoe, M["shoe"], parent=pivot_name)

# Small robe buttons down the center line.
for idx, y in enumerate([0.94, 0.80, 0.66, 0.52]):
    ellipsoid([0, y, 0.168 if y < 0.9 else 0.162], [0.014, 0.014, 0.009], M["button"], f"AbayaButton_{idx}")

# ---- Head and hijab ----
add_pivot("Head", [0, 1.43, 0])
# Hijab outer shell, placed behind the face so the face remains visible.
ellipsoid([0, 0.035, -0.045], [0.355, 0.455, 0.265], M["hijab"], "HijabHood", parent="Head", count=(32, 22))
# Lower wrap folds frame the cheeks and cover the neck.
ellipsoid([-0.252, -0.16, 0.045], [0.045, 0.15, 0.075], M["hijab_light"], "HijabFold_L", parent="Head", rotation=trimesh.transformations.rotation_matrix(-0.18, [0, 0, 1]))
ellipsoid([0.252, -0.16, 0.045], [0.045, 0.15, 0.075], M["hijab_light"], "HijabFold_R", parent="Head", rotation=trimesh.transformations.rotation_matrix(0.18, [0, 0, 1]))
# Face, slightly oversized eyes, and soft features.
ellipsoid([0, -0.005, 0.125], [0.262, 0.318, 0.17], M["skin"], "Face", parent="Head", count=(32, 22))
# Soft forehead highlight (subtle, same skin family)
ellipsoid([0, 0.18, 0.266], [0.065, 0.026, 0.004], M["skin_light"], "ForeheadHighlight", parent="Head")

for side, suffix in [(-1, "L"), (1, "R")]:
    x = side * 0.098
    # Eye whites, iris, pupil, and catchlight
    ellipsoid([x, 0.045, 0.265], [0.067, 0.046, 0.026], M["eye_white"], f"Eye_{suffix}_White", parent="Head")
    ellipsoid([x + side * 0.003, 0.044, 0.287], [0.032, 0.036, 0.014], M["iris"], f"Eye_{suffix}_Iris", parent="Head")
    ellipsoid([x + side * 0.003, 0.043, 0.298], [0.018, 0.025, 0.008], M["pupil"], f"Eye_{suffix}_Pupil", parent="Head")
    ellipsoid([x - 0.008, 0.057, 0.306], [0.007, 0.009, 0.004], M["shine"], f"Eye_{suffix}_Catchlight", parent="Head")
    # Curved eyebrows
    brow_points = [
        [x - 0.066, 0.123, 0.273],
        [x - 0.035, 0.148, 0.282],
        [x + 0.005, 0.153, 0.284],
        [x + 0.045, 0.14, 0.28],
        [x + 0.066, 0.124, 0.27],
    ]
    tube(brow_points, 0.012, M["brow"], f"Eyebrow_{suffix}", parent="Head", sides=7)
    # Upper lashes at outer edge
    tube([[x + side * 0.045, 0.064, 0.287], [x + side * 0.065, 0.082, 0.278], [x + side * 0.079, 0.087, 0.27]], 0.0045, M["brow"], f"Lashes_{suffix}", parent="Head", sides=6)
    # Cheek blush
    ellipsoid([side * 0.158, -0.07, 0.246], [0.038, 0.023, 0.008], M["blush"], f"Blush_{suffix}", parent="Head")

# Nose and friendly smile.
ellipsoid([0, -0.035, 0.286], [0.016, 0.024, 0.014], M["skin_light"], "Nose", parent="Head")
ellipsoid([0, -0.142, 0.277], [0.083, 0.031, 0.011], M["mouth"], "SmileMouth", parent="Head")
ellipsoid([0, -0.13, 0.287], [0.061, 0.017, 0.006], M["teeth"], "SmileTeeth", parent="Head")
tube([[-0.086, -0.135, 0.289], [-0.052, -0.157, 0.292], [0, -0.164, 0.294], [0.052, -0.157, 0.292], [0.086, -0.135, 0.289]], 0.006, M["mouth"], "LowerSmileLine", parent="Head", sides=6)

# Fine hood seam framing the face opening. Coordinates follow the face edge.
seam_pts = [
    [-0.235, 0.20, 0.165], [-0.255, 0.12, 0.18], [-0.258, 0.02, 0.19],
    [-0.235, -0.09, 0.20], [-0.19, -0.18, 0.205], [-0.11, -0.25, 0.205],
    [0.0, -0.28, 0.20], [0.11, -0.25, 0.205], [0.19, -0.18, 0.205],
    [0.235, -0.09, 0.20], [0.258, 0.02, 0.19], [0.255, 0.12, 0.18], [0.235, 0.20, 0.165],
]
tube(seam_pts, 0.009, M["hijab_seam"], "HijabFaceSeam", parent="Head", sides=7)

# Hijab chest drape and two soft fabric folds.
scarf_patch()
tube([[-0.21, 1.12, 0.205], [-0.16, 0.96, 0.245], [-0.13, 0.79, 0.242], [-0.10, 0.66, 0.225]], 0.009, M["hijab_light"], "ScarfFold_L")
tube([[-0.04, 1.16, 0.245], [0.015, 1.0, 0.255], [0.035, 0.85, 0.25]], 0.007, M["hijab_light"], "ScarfFold_C")

# Export GLB with named pivot nodes (Head, Arm_L/Arm_R, Leg_L/Leg_R).
OUT.parent.mkdir(parents=True, exist_ok=True)
blob = scene.export(file_type="glb")
OUT.write_bytes(blob)
print(f"Wrote {OUT} ({OUT.stat().st_size:,} bytes)")
print(f"Scene geometry count: {len(scene.geometry)}")
print(f"Scene bounds: {scene.bounds.tolist()}")
