/**
 * Fleet.js
 * --------
 * Builds 4 spacecraft and manages their orbital animation.
 * Ships are added directly to the scene — NOT to spaceStation —
 * so they orbit independently without inheriting station rotation.
 *
 * Returns an update() function that SceneManager calls every frame
 * to advance each ship along its unique orbital path.
 *
 * @param {THREE.Scene} scene - The main Three.js scene
 * @returns {{ update: function }} - Animation update function
 */

import * as THREE from "three";

export function createFleet(scene) {

    const fleet = []; // Holds all 4 ship groups

    // Each ship has unique orbital parameters — radius, inclination, speed.
    // Inclination lifts the orbit out of the flat equatorial plane using
    // 3D trigonometry, creating a realistic multi-orbit environment.
    const shipOrbits = [
        { radius: 80,  inclination: 0,            speed: 0.0005  }, // Flat equatorial
        { radius: 95,  inclination: Math.PI / 8,  speed: 0.0004  }, // Slightly tilted, slower
        { radius: 70,  inclination: -Math.PI / 6, speed: 0.0006  }, // Tilted other way, faster
        { radius: 110, inclination: Math.PI / 5,  speed: 0.00035 }, // Wide, steep, slowest
    ];

    /* -------------------------------------------------------------------------
    SHIP CONSTRUCTION
    Each ship is built from 5 parts assembled as a THREE.Group:
      1. Fuselage     — main body cylinder, laid flat along Z axis
      2. Nose         — flattened sphere at the front (-Z)
      3. Wings        — wide flat box, thin on Y
      4. Engine pods  — two cylinders at the rear wing tips
      5. Engine glow  — stretched spheres simulating exhaust flame
    ------------------------------------------------------------------------- */

    // Builds and returns a single spacecraft group
    const buildShip = () => {
        const ship = new THREE.Group();

        // --- 1. Fuselage ---
        // Tapered cylinder laid flat — wider at rear, narrower at front
        const fuseGeo = new THREE.CylinderGeometry(1, 1.4, 10, 12);
        const fuseSolid = new THREE.Mesh(fuseGeo,
            new THREE.MeshBasicMaterial({ color: 0x050505 }));
        const fuseWire = new THREE.Mesh(fuseGeo,
            new THREE.MeshBasicMaterial({ color: 0xff6600, wireframe: true }));
        fuseWire.scale.set(1.02, 1.02, 1.02);
        const fuselage = new THREE.Group();
        fuselage.add(fuseSolid, fuseWire);
        fuselage.rotation.x = Math.PI / 2; // Lay flat — nose points along -Z
        ship.add(fuselage);

        // --- 2. Nose ---
        // Flattened sphere at the front tip of the fuselage
        // scale.y = 0.6 squashes it for a more aerodynamic profile
        const noseGeo = new THREE.SphereGeometry(1.1, 12, 8);
        const noseSolid = new THREE.Mesh(noseGeo,
            new THREE.MeshBasicMaterial({ color: 0x050505 }));
        const noseWire = new THREE.Mesh(noseGeo,
            new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true }));
        noseWire.scale.set(1.02, 1.02, 1.02);
        const nose = new THREE.Group();
        nose.add(noseSolid, noseWire);
        nose.position.z = -5.5; // Front tip of the fuselage
        nose.scale.y = 0.6;     // Flatten for aerodynamic profile
        ship.add(nose);

        // --- 3. Delta wings ---
        // Wide flat box — thin on Y to represent flat wing surfaces
        // Non-uniform scaling (16 x 0.3 x 7) demonstrates the criteria requirement
        const wingGeo = new THREE.BoxGeometry(16, 0.3, 7);
        const wingSolid = new THREE.Mesh(wingGeo,
            new THREE.MeshBasicMaterial({ color: 0x050505 }));
        const wingWire = new THREE.Mesh(wingGeo,
            new THREE.MeshBasicMaterial({ color: 0xff6600, wireframe: true }));
        wingWire.scale.set(1.01, 1.01, 1.01);
        const wings = new THREE.Group();
        wings.add(wingSolid, wingWire);
        wings.position.z = 1; // Slightly toward the rear of the fuselage
        ship.add(wings);

        // --- 4. Engine pods ---
        // Two cylinders mounted at the rear wing tips, pointing along Z
        const podGeo = new THREE.CylinderGeometry(0.5, 0.7, 5, 10);
        const podSolidMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
        const podWireMat  = new THREE.MeshBasicMaterial({ color: 0xff6600, wireframe: true });

        [-6, 6].forEach((xPos) => {
            const podSolid = new THREE.Mesh(podGeo, podSolidMat);
            const podWire  = new THREE.Mesh(podGeo, podWireMat);
            podWire.scale.set(1.02, 1.02, 1.02);
            const pod = new THREE.Group();
            pod.add(podSolid, podWire);
            pod.rotation.x = Math.PI / 2; // Point along Z axis
            pod.position.set(xPos, 0, 2); // Left (-6) and right (+6) wing tips
            ship.add(pod);
        });

        // --- 5. Engine glow ---
        // Stretched spheres behind each pod — scale.z creates the flame shape
        const glowGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });

        [-6, 6].forEach((xPos) => {
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.scale.set(1, 1, 4);       // Stretch backward into flame shape
            glow.position.set(xPos, 0, 5); // Behind the engine pod
            ship.add(glow);
        });

        return ship;
    };

    // Build all 4 ships and add them to the scene
    for (let i = 0; i < 4; i++) {
        const ship = buildShip();
        scene.add(ship); // Added to scene directly — not spaceStation
        fleet.push(ship);
    }

    /* -------------------------------------------------------------------------
    UPDATE FUNCTION
    Called every frame by SceneManager.
    Advances each ship along its unique orbital path using 3D trigonometry.

    Orbital position formula:
      X = cos(angle) * radius
      Z = sin(angle) * cos(inclination) * radius  — compressed by tilt
      Y = sin(angle) * sin(inclination) * radius  — vertical lift from tilt

    Facing direction — look-behind method:
      The nose points along -Z due to fuselage pre-rotation.
      lookAt() points +Z at the target, so we look at the PREVIOUS
      position on the orbit. This makes the nose lead correctly.
    ------------------------------------------------------------------------- */
    const update = (orbitClock, isOrbiting) => {
        if (!isOrbiting) return; // Ships frozen when paused

        fleet.forEach((ship, index) => {
            const { radius, inclination, speed } = shipOrbits[index];

            // Space ships evenly around their orbits at start (90 degrees apart)
            const angleOffset = (index / fleet.length) * Math.PI * 2;
            const currentAngle = orbitClock * speed + angleOffset;

            // 3D orbital translation
            ship.position.x = Math.cos(currentAngle) * radius;
            ship.position.z = Math.sin(currentAngle) * Math.cos(inclination) * radius;
            ship.position.y = Math.sin(currentAngle) * Math.sin(inclination) * radius;

            // Look-behind — nose faces the direction of travel
            const prevAngle = currentAngle - 0.01;
            const prevX = Math.cos(prevAngle) * radius;
            const prevZ = Math.sin(prevAngle) * Math.cos(inclination) * radius;
            const prevY = Math.sin(prevAngle) * Math.sin(inclination) * radius;
            ship.lookAt(new THREE.Vector3(prevX, prevY, prevZ));
        });
    };

    return { update };
}