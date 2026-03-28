/**
 * Station.js
 * ----------
 * Builds the entire space station and returns the root group.
 * All components attach to a single spaceStation THREE.Group,
 * so rotating that group rotates the entire station as one unit.
 *
 * Returns { spaceStation, solarGroup } — solarGroup is returned
 * separately so the animation loop can rotate it independently
 * to imply solar panel sun-tracking.
 *
 * @param {THREE.Scene} scene - The main Three.js scene
 * @returns {{ spaceStation: THREE.Group, solarGroup: THREE.Group }}
 */

import * as THREE from "three";

export function createStation(scene) {

    // Root group — rotating this rotates the entire station
    const spaceStation = new THREE.Group();
    scene.add(spaceStation);

    /* -------------------------------------------------------------------------
    SHARED MATERIAL HELPERS
    Every component uses a solid dark mesh with a scaled wireframe overlay.
    Defining these helpers here avoids repeating the same two lines everywhere.
    ------------------------------------------------------------------------- */

    // Returns a solid dark mesh material — occludes geometry behind it
    const solid = () => new THREE.MeshBasicMaterial({ color: 0x050505 });

    // Returns a wireframe material in the given hex colour
    const wire = (hex) => new THREE.MeshBasicMaterial({ color: hex, wireframe: true });

    /**
     * Builds a composite group: solid mesh + scaled wireframe overlay.
     * The wireframe is scaled up slightly to sit on the surface without
     * Z-fighting (flickering caused by two surfaces sharing the same depth).
     *
     * @param {THREE.BufferGeometry} geo - Shared geometry
     * @param {number} hex - Wireframe colour
     * @param {number} [scale=1.01] - Wireframe scale factor
     * @returns {THREE.Group}
     */
    const buildMesh = (geo, hex, scale = 1.01) => {
        const group = new THREE.Group();
        const solidMesh = new THREE.Mesh(geo, solid());
        const wireMesh  = new THREE.Mesh(geo, wire(hex));
        wireMesh.scale.setScalar(scale); // Uniform scale on all 3 axes
        group.add(solidMesh, wireMesh);
        return group;
    };

    /* -------------------------------------------------------------------------
    COMPONENT 1 — COMMAND SPHERE
    The pressurised command module at the midpoint of the spine (Y=0).
    Junction collars above and below suggest it is bolted onto the truss.
    ------------------------------------------------------------------------- */

    const coreGroup = new THREE.Group();

    // Main sphere — the visual centrepiece of the station
    const sphereGeo = new THREE.SphereGeometry(16, 32, 16);
    coreGroup.add(buildMesh(sphereGeo, 0x00f3ff));

    // Junction collars — tapered cylinders (radiusTop < radiusBottom = taper)
    // Placed above and below the sphere where it meets the spine
    const collarGeo = new THREE.CylinderGeometry(3, 6, 6, 16);

    const topCollar = buildMesh(collarGeo, 0x00f3ff);
    topCollar.position.y = 15; // Top edge of the sphere
    coreGroup.add(topCollar);

    const bottomCollar = buildMesh(collarGeo, 0x00f3ff);
    bottomCollar.position.y = -15; // Mirror at the bottom
    coreGroup.add(bottomCollar);

    spaceStation.add(coreGroup);

    /* -------------------------------------------------------------------------
    COMPONENT 2 — CENTRAL SPINE
    A vertical truss cylinder running the full height of the station (Y axis).
    Every major component attaches to this — it is the structural backbone.
    Real analogue: the Integrated Truss Structure (ITS) on the ISS.
    ------------------------------------------------------------------------- */

    const spineGroup = new THREE.Group();

    // Main truss cylinder — tall and thin along the Y axis
    const spineGeo = new THREE.CylinderGeometry(0.8, 0.8, 120, 12);
    spineGroup.add(buildMesh(spineGeo, 0x00f3ff));

    // Collar rings spaced evenly along the spine — suggest segmented truss construction
    for (let i = -3; i <= 3; i++) {
        const ringGeo = new THREE.TorusGeometry(2.2, 0.3, 8, 24);
        const ring = buildMesh(ringGeo, 0x00f3ff);
        ring.rotation.x = Math.PI / 2; // Wrap around the spine horizontally
        ring.position.y = i * 16;      // i goes -3 to +3, multiply by 16 to space evenly
        spineGroup.add(ring);
    }

    spaceStation.add(spineGroup);

    /* -------------------------------------------------------------------------
    COMPONENT 3 — HABITAT & DOCKING MODULES (minimum 6 required)
    Six pressurised modules extend horizontally from the spine — three port
    (+X) and three starboard (-X), staggered at Y = 30, 0, -30.

    Position maths (port side):
      Tunnel:    centred at x=5,  spans x=0  to x=10
      Habitat:   centred at x=19, spans x=10 to x=28
      Inner cap: at x=10 — junction between tunnel and habitat
      Outer cap: at x=28 — far docking end
    ------------------------------------------------------------------------- */

    const habitatGroup = new THREE.Group();

    // Shared geometries — defined once, reused for port and starboard sides
    const tunnelGeo  = new THREE.CylinderGeometry(1.2, 1.2, 10, 12);
    const habitatGeo = new THREE.CylinderGeometry(3.5, 3.5, 18, 16);
    const capGeo     = new THREE.CylinderGeometry(3.5, 3.5, 0.8, 16);

    // Build one complete module assembly for a given side and height
    const buildModule = (side, yPos) => {
        const moduleGroup = new THREE.Group();

        // Connecting tunnel — rotated 90 degrees on Z to point along X axis
        const tunnel = buildMesh(tunnelGeo, 0xff4d00, 1.02);
        tunnel.rotation.z = Math.PI / 2;
        tunnel.position.x = side * 5; // Centred at x=5 (or -5), spans 0 to 10
        moduleGroup.add(tunnel);

        // Main habitat cylinder — begins exactly where the tunnel ends
        const habitat = buildMesh(habitatGeo, 0xff4d00, 1.02);
        habitat.rotation.z = Math.PI / 2;
        habitat.position.x = side * 19; // Centred at x=19, spans x=10 to x=28
        moduleGroup.add(habitat);

        // Inner cap — junction between tunnel and habitat
        const innerCap = buildMesh(capGeo, 0x00f3ff, 1.02);
        innerCap.rotation.z = Math.PI / 2;
        innerCap.position.x = side * 10;
        moduleGroup.add(innerCap);

        // Outer cap — far docking end of the habitat
        const outerCap = buildMesh(capGeo, 0x00f3ff, 1.02);
        outerCap.rotation.z = Math.PI / 2;
        outerCap.position.x = side * 28;
        moduleGroup.add(outerCap);

        moduleGroup.position.y = yPos;
        return moduleGroup;
    };

    // Build 6 modules — port (+1) and starboard (-1) at three heights
    [30, 0, -30].forEach((yPos) => {
        habitatGroup.add(buildModule( 1, yPos)); // Port side
        habitatGroup.add(buildModule(-1, yPos)); // Starboard side
    });

    spaceStation.add(habitatGroup);

    /* -------------------------------------------------------------------------
    COMPONENT 4 — SOLAR ARRAY ARMS (minimum 4 required)
    Four arms attach to the spine alternating port/starboard like the ISS.
    The solarGroup is returned separately so it can be rotated independently
    in the animation loop — implying the panels are tracking the sun.
    ------------------------------------------------------------------------- */

    const solarGroup = new THREE.Group();

    // Mount points: [yPosition, side] — +1 port (right), -1 starboard (left)
    const arrayMounts = [
        [45,  1],  // Upper port
        [45, -1],  // Upper starboard
        [-45,  1], // Lower port
        [-45, -1], // Lower starboard
    ];

    const buildSolarArm = (yPos, side) => {
        const armGroup = new THREE.Group();

        // Main boom — thin cylinder rotated to point along X axis
        const boomGeo = new THREE.CylinderGeometry(0.4, 0.4, 45, 8);
        const boom = buildMesh(boomGeo, 0x00f3ff, 1.02);
        boom.rotation.z = Math.PI / 2;
        boom.position.x = side * 22.5; // Centre so it extends outward
        armGroup.add(boom);

        // Cross-brace rings — suggest the boom is a lattice truss structure
        for (let b = -2; b <= 2; b++) {
            const braceGeo = new THREE.TorusGeometry(1.5, 0.2, 6, 12);
            const brace = buildMesh(braceGeo, 0x00f3ff, 1.02);
            brace.rotation.x = Math.PI / 2; // Wrap around the boom axis
            brace.position.x = side * (22.5 + b * 8); // Space 5 braces along boom
            armGroup.add(brace);
        }

        // Photovoltaic panels — flat boxes fore and aft of the boom
        const panelGeo = new THREE.BoxGeometry(5, 0.15, 24);
        const forePanel = buildMesh(panelGeo, 0x0066ff, 1.01);
        const aftPanel  = buildMesh(panelGeo, 0x0066ff, 1.01);
        forePanel.position.set(side * 22.5, 0,  15); // Forward of boom on Z
        aftPanel.position.set( side * 22.5, 0, -15); // Behind boom on Z
        armGroup.add(forePanel, aftPanel);

        // Mounting brackets — connect panels to the boom
        const bracketGeo = new THREE.BoxGeometry(1, 1, 6);
        const foreBracket = buildMesh(bracketGeo, 0x00f3ff, 1.02);
        const aftBracket  = buildMesh(bracketGeo, 0x00f3ff, 1.02);
        foreBracket.position.set(side * 22.5, 0,  6);
        aftBracket.position.set( side * 22.5, 0, -6);
        armGroup.add(foreBracket, aftBracket);

        armGroup.position.y = yPos;
        return armGroup;
    };

    arrayMounts.forEach(([yPos, side]) => {
        solarGroup.add(buildSolarArm(yPos, side));
    });

    spaceStation.add(solarGroup);

    /* -------------------------------------------------------------------------
    COMPONENT 5 — COMMUNICATION TOWERS (minimum 2 required)
    One tower at the top of the spine (Y=60), one at the bottom (Y=-60).
    The buildTower function builds both from a single definition.
    A direction multiplier (dir) flips all Y positions for the bottom tower,
    making it an exact vertical mirror without duplicating code.
    ------------------------------------------------------------------------- */

    const commsGroup = new THREE.Group();

    const buildTower = (isTop) => {
        const tower = new THREE.Group();
        const dir = isTop ? 1 : -1; // +1 top, -1 bottom — flips all Y positions

        // Base mounting plate — sits flush at the end of the spine
        const baseGeo = new THREE.CylinderGeometry(4, 4, 2, 16);
        const base = buildMesh(baseGeo, 0xffcc00, 1.02);
        base.position.y = dir * 1;
        tower.add(base);

        // Telescoping mast — 3 segments of decreasing radius
        // Suggests a multi-stage extendable antenna mast
        const mastSegments = [
            { rTop: 1.4, rBot: 1.8, h: 12, y: dir * 8  },
            { rTop: 0.9, rBot: 1.2, h: 10, y: dir * 19 },
            { rTop: 0.4, rBot: 0.8, h: 8,  y: dir * 28 },
        ];

        mastSegments.forEach(({ rTop, rBot, h, y }) => {
            const mastGeo = new THREE.CylinderGeometry(rTop, rBot, h, 10);
            const mast = buildMesh(mastGeo, 0xffcc00, 1.02);
            mast.position.y = y;
            tower.add(mast);
        });

        // Parabolic dish — cone tilted at 45 degrees to simulate scanning position
        const dishGeo = new THREE.ConeGeometry(5, 3, 20);
        const dish = buildMesh(dishGeo, 0xffcc00, 1.02);
        dish.position.y = dir * 34;
        dish.rotation.x = isTop ? Math.PI / 4 : -Math.PI / 4;
        tower.add(dish);

        // Beacon tip — navigational beacon at the very top of the mast
        const beaconGeo = new THREE.SphereGeometry(0.8, 8, 8);
        const beacon = new THREE.Mesh(beaconGeo,
            new THREE.MeshBasicMaterial({ color: 0x00f3ff }));
        beacon.position.y = dir * 38;
        tower.add(beacon);

        // Position the whole tower at the spine tip (spine is 120 units tall)
        tower.position.y = dir * 60;
        return tower;
    };

    commsGroup.add(buildTower(true));  // Top tower
    commsGroup.add(buildTower(false)); // Bottom tower — mirrored automatically
    spaceStation.add(commsGroup);

    /* -------------------------------------------------------------------------
    Return the station root group and solarGroup.
    SceneManager uses spaceStation for overall rotation.
    SceneManager uses solarGroup for independent panel rotation.
    ------------------------------------------------------------------------- */
    return { spaceStation, solarGroup };
}