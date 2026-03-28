/**
 * Starfield.js
 * ------------
 * Creates a two-layer starfield and adds it directly to the scene.
 * Layer 1 — 3000 small distant stars (size 0.4, spread 2000 units)
 * Layer 2 — 300 larger foreground stars (size 1.2, spread 1000 units)
 * The size difference implies distance — closer stars appear bigger.
 * Both layers use BufferGeometry for performance (one draw call each).
 *
 * @param {THREE.Scene} scene - The main Three.js scene
 */

import * as THREE from "three";

export function createStarfield(scene) {

    // --- Layer 1: Distant starfield ---
    // Small points spread across a wide volume — the deep space backdrop
    const distantStarGeo = new THREE.BufferGeometry();
    const distantStarVertices = [];

    // Push 3 values per star (X, Y, Z) into a flat array
    for (let i = 0; i < 3000; i++) {
        distantStarVertices.push(
            (Math.random() - 0.5) * 2000, // X — random position in 2000 unit cube
            (Math.random() - 0.5) * 2000, // Y
            (Math.random() - 0.5) * 2000  // Z
        );
    }

    // Float32BufferAttribute expects a flat array and the item size (3 = XYZ per vertex)
    distantStarGeo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(distantStarVertices, 3)
    );

    const distantStarMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.4 });
    const distantStars = new THREE.Points(distantStarGeo, distantStarMat);
    scene.add(distantStars);

    // --- Layer 2: Foreground stars ---
    // Fewer stars, larger size, tighter spread — implies they are closer
    const nearStarGeo = new THREE.BufferGeometry();
    const nearStarVertices = [];

    for (let i = 0; i < 300; i++) {
        nearStarVertices.push(
            (Math.random() - 0.5) * 1000, // X — tighter spread than distant layer
            (Math.random() - 0.5) * 1000, // Y
            (Math.random() - 0.5) * 1000  // Z
        );
    }

    nearStarGeo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(nearStarVertices, 3)
    );

    // Larger point size (1.2 vs 0.4) makes these stars read as closer and brighter
    const nearStarMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2 });
    const nearStars = new THREE.Points(nearStarGeo, nearStarMat);
    scene.add(nearStars);
}