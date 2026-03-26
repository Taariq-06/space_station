import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// --- STATE MANAGEMENT ---
const fleet = []; // Array to track all orbiting spacecraft
let isOrbiting = true; // State toggle for the pause/resume requirement
let currentOrbitTime = 0; // Independent time tracker for smooth pausing
let isExternalView = true; // Tracks current camera mode

// --- SCENE SETUP ---
const canvas = document.querySelector("#c");
const scene = new THREE.Scene();

// A dark background, but not pure black, to allow the darkest station parts to be visible
scene.background = new THREE.Color("#020205");

// --- CAMERA SETUP (Perspective Projection Requirement) ---
// 75 degree FOV, matching browser aspect ratio, near clipping at 0.1, far at 2000 to see distant stars
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000,
);
camera.position.set(0, 30, 150); // Positioned slightly above and pulled back

// --- RENDERER SETUP ---
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setSize(window.innerWidth, window.innerHeight); // use the width and height of the browser to render the app

// --- CAMERA CONTROLS (Free-roaming Requirement) ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Required for smooth, cinematic camera movement
controls.dampingFactor = 0.05; // Gives it that cinematic, smooth glide
controls.maxDistance = 500; // Prevents the user from zooming infinitely into the void

/* ============================================================================
   COMPONENT 1: THE STARFIELD (Environment Context)
   ============================================================================
*/
// Generate 2000 random points in space to create a convincing background
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
const starVertices = [];

for (let i = 0; i < 2000; i++) {
  const x = (Math.random() - 0.5) * 1000;
  const y = (Math.random() - 0.5) * 1000;
  const z = (Math.random() - 0.5) * 1000;
  starVertices.push(x, y, z);
}
starGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starVertices, 3),
);
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

/* ============================================================================
   COMPONENT 2: THE SPACE STATION (Hierarchical Group)
   ============================================================================
*/
// This is the parent object for all station components.
// Rotating this group will rotate the entire station, fulfilling the hierarchy requirement.
const spaceStation = new THREE.Group();
scene.add(spaceStation);

// --- THE CENTRAL CORE ---
const coreGroup = new THREE.Group();

// 1. The Solid Base (Deep Space Grey)
const coreGeometry = new THREE.SphereGeometry(16, 32, 16);
const coreSolidMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
const coreSolid = new THREE.Mesh(coreGeometry, coreSolidMaterial);

// 2. The Wireframe Overlay (Neon Cyan)
// Scale it up by 1% (1.01) so it sits perfectly on the surface of the solid base without Z-fighting (flickering)
const coreWireMaterial = new THREE.MeshBasicMaterial({
  color: 0x00f3ff,
  wireframe: true,
});
const coreWire = new THREE.Mesh(coreGeometry, coreWireMaterial);
coreWire.scale.set(1.01, 1.01, 1.01);

// Assemble the Core
coreGroup.add(coreSolid);
coreGroup.add(coreWire);

spaceStation.add(coreGroup);

// 3. Junction collars — where the sphere meets the spine above and below.
// These tapered cylinders suggest the sphere is physically bolted onto
// the truss backbone, rather than just floating around it.
// Notice radiusTop is smaller than radiusBottom — this creates the taper.
const collarGeo = new THREE.CylinderGeometry(3, 6, 6, 16);
const collarSolidMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
const collarWireMat = new THREE.MeshBasicMaterial({
  color: 0x00f3ff,
  wireframe: true,
});

// Top junction collar — sits where the spine exits the top of the sphere
const topCollarSolid = new THREE.Mesh(collarGeo, collarSolidMat);
const topCollarWire = new THREE.Mesh(collarGeo, collarWireMat);
topCollarWire.scale.set(1.01, 1.01, 1.01);
const topCollar = new THREE.Group();
topCollar.add(topCollarSolid);
topCollar.add(topCollarWire);
topCollar.position.y = 15; // Sit at the top edge of the sphere
coreGroup.add(topCollar);

// Bottom junction collar — mirrors the top exactly
const bottomCollarSolid = new THREE.Mesh(collarGeo, collarSolidMat);
const bottomCollarWire = new THREE.Mesh(collarGeo, collarWireMat);
bottomCollarWire.scale.set(1.01, 1.01, 1.01);
const bottomCollar = new THREE.Group();
bottomCollar.add(bottomCollarSolid);
bottomCollar.add(bottomCollarWire);
bottomCollar.position.y = -15; // Mirror position at the bottom
coreGroup.add(bottomCollar);

/* ============================================================================
COMPONENT 3: THE CENTRAL SPINE
============================================================================
The spine is the structural backbone of the station — a vertical truss
that runs the full height of the station along the Y axis. Every major
component (habitat modules, solar arrays, comms towers) will attach to
this. Without it, the station has no engineering logic.

Real analogue: the Integrated Truss Structure (ITS) on the ISS (International Space Station).
============================================================================ */
const spineGroup = new THREE.Group();

// The main truss cylinder — tall and thin, running along the Y axis
// CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
const spineGeo = new THREE.CylinderGeometry(0.8, 0.8, 120, 12);
const spineSolidMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
const spineWireMat = new THREE.MeshBasicMaterial({
  color: 0x00f3ff,
  wireframe: true,
});

const spineSolid = new THREE.Mesh(spineGeo, spineSolidMat);
const spineWire = new THREE.Mesh(spineGeo, spineWireMat);

// Scale the wireframe up by 1% to sit on the surface without Z-fighting
spineWire.scale.set(1.01, 1.01, 1.01);

spineGroup.add(spineSolid);
spineGroup.add(spineWire);

// Add evenly spaced collar rings along the spine.
// These suggest segmented truss construction — like the P/S truss
// segments on the ISS. They also break up the plain cylinder visually.

for (let i = -3; i <= 3; i++) {
  // TorusGeometry(radius, tube thickness, radial segments, tubular segments)
  const collarGeo = new THREE.TorusGeometry(2.2, 0.3, 8, 24);
  const collarSolidMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
  const collarWireMat = new THREE.MeshBasicMaterial({
    color: 0x00f3ff,
    wireframe: true,
  });

  const collarSolid = new THREE.Mesh(collarGeo, collarSolidMat);
  const collarWire = new THREE.Mesh(collarGeo, collarWireMat);
  collarWire.scale.set(1.01, 1.01, 1.01);

  const collar = new THREE.Group();
  collar.add(collarSolid);
  collar.add(collarWire);

  // Rotate the torus so it wraps around the spine horizontally
  collar.rotation.x = Math.PI / 2;

  // Space the 7 collars evenly - i goes from -3 to +3, multiply by 16
  collar.position.y = i * 16;

  spineGroup.add(collar);
}

// Attach the spine to the main station group
spaceStation.add(spineGroup);

/* ============================================================================
COMPONENT 4: HABITAT & DOCKING MODULES (minimum 6 required)
============================================================================
Six pressurised habitat modules extend horizontally from the spine,
three on each side, staggered at three vertical positions.
This matches how modules on the ISS attach to the central truss —
branching outward rather than arranged in a wheel.

Each module consists of:
1. A connecting tunnel (thin cylinder) from the spine to the module
2. A main habitat cylinder (the pressurised volume)
3. Two end caps (flat discs) — the docking interfaces

POSITION MATHS (port side, +X):
  Tunnel:     length 10, centred at x=5,  spans x=0  to x=10
  Habitat:    length 18, centred at x=19, spans x=10 to x=28
  Inner cap:  at x=10 — junction between tunnel and habitat
  Outer cap:  at x=28 — far docking end of habitat
  (Starboard side mirrors these with negative X values)
============================================================================ */
const habitatGroup = new THREE.Group();

// The three vertical heights where modules attach to the spine.
// Port = right side (+X), Starboard = left side (-X)
const moduleHeights = [30, 0, -30];

// Shared geometries — defined once, reused for both sides
// This avoids redundant geometry declarations
const tunnelGeo = new THREE.CylinderGeometry(1.2, 1.2, 10, 12);
const habitatGeo = new THREE.CylinderGeometry(3.5, 3.5, 18, 16);
const capGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.8, 16);

// Shared materials — defined once, reused for both sides
const tunnelSolidMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
const tunnelWireMat = new THREE.MeshBasicMaterial({
  color: 0xff4d00,
  wireframe: true,
});
const habitatSolidMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
const habitatWireMat = new THREE.MeshBasicMaterial({
  color: 0xff4d00,
  wireframe: true,
});
const capSolidMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
const capWireMat = new THREE.MeshBasicMaterial({
  color: 0x00f3ff,
  wireframe: true,
});

moduleHeights.forEach((yPos) => {
  // --- PORT SIDE MODULE (right, +X direction) ---
  const portModule = new THREE.Group();

  // 1. Connecting tunnel — starts inside the spine (x=0) and extends to x=10
  // Rotated 90 degrees on Z so it points along the X axis horizontally
  const tunnelSolid = new THREE.Mesh(tunnelGeo, tunnelSolidMat);
  const tunnelWire = new THREE.Mesh(tunnelGeo, tunnelWireMat);
  tunnelWire.scale.set(1.02, 1.02, 1.02);
  const tunnel = new THREE.Group();
  tunnel.add(tunnelSolid);
  tunnel.add(tunnelWire);
  tunnel.rotation.z = Math.PI / 2; // Point along X axis
  tunnel.position.x = 5; // Centred at x=5, spans x=0 to x=10
  portModule.add(tunnel);

  // 2. Main habitat cylinder — begins exactly where the tunnel ends (x=10)
  const habitatSolid = new THREE.Mesh(habitatGeo, habitatSolidMat);
  const habitatWire = new THREE.Mesh(habitatGeo, habitatWireMat);
  habitatWire.scale.set(1.02, 1.02, 1.02);
  const habitat = new THREE.Group();
  habitat.add(habitatSolid);
  habitat.add(habitatWire);
  habitat.rotation.z = Math.PI / 2; // Horizontal orientation
  habitat.position.x = 19; // Centred at x=19, spans x=10 to x=28
  portModule.add(habitat);

  // 3. Inner end cap — sits at the junction between tunnel and habitat (x=10)
  const innerCapSolid = new THREE.Mesh(capGeo, capSolidMat);
  const innerCapWire = new THREE.Mesh(capGeo, capWireMat);
  innerCapWire.scale.set(1.02, 1.02, 1.02);
  const innerCap = new THREE.Group();
  innerCap.add(innerCapSolid);
  innerCap.add(innerCapWire);
  innerCap.rotation.z = Math.PI / 2;
  innerCap.position.x = 10; // Junction point — where tunnel meets habitat
  portModule.add(innerCap);

  // 4. Outer end cap — sits at the far docking end of the habitat (x=28)
  const outerCapSolid = new THREE.Mesh(capGeo, capSolidMat);
  const outerCapWire = new THREE.Mesh(capGeo, capWireMat);
  outerCapWire.scale.set(1.02, 1.02, 1.02);
  const outerCap = new THREE.Group();
  outerCap.add(outerCapSolid);
  outerCap.add(outerCapWire);
  outerCap.rotation.z = Math.PI / 2;
  outerCap.position.x = 28; // Far docking end of habitat
  portModule.add(outerCap);

  portModule.position.y = yPos;
  habitatGroup.add(portModule);

  // --- STARBOARD SIDE MODULE (left, -X direction) ---
  // Exact mirror of the port module — all X positions are negated
  const starboardModule = new THREE.Group();

  const tunnelSolid2 = new THREE.Mesh(tunnelGeo, tunnelSolidMat);
  const tunnelWire2 = new THREE.Mesh(tunnelGeo, tunnelWireMat);
  tunnelWire2.scale.set(1.02, 1.02, 1.02);
  const tunnel2 = new THREE.Group();
  tunnel2.add(tunnelSolid2);
  tunnel2.add(tunnelWire2);
  tunnel2.rotation.z = Math.PI / 2;
  tunnel2.position.x = -5; // Mirror of port tunnel
  starboardModule.add(tunnel2);

  const habitatSolid2 = new THREE.Mesh(habitatGeo, habitatSolidMat);
  const habitatWire2 = new THREE.Mesh(habitatGeo, habitatWireMat);
  habitatWire2.scale.set(1.02, 1.02, 1.02);
  const habitat2 = new THREE.Group();
  habitat2.add(habitatSolid2);
  habitat2.add(habitatWire2);
  habitat2.rotation.z = Math.PI / 2;
  habitat2.position.x = -19; // Mirror of port habitat
  starboardModule.add(habitat2);

  const innerCapSolid2 = new THREE.Mesh(capGeo, capSolidMat);
  const innerCapWire2 = new THREE.Mesh(capGeo, capWireMat);
  innerCapWire2.scale.set(1.02, 1.02, 1.02);
  const innerCap2 = new THREE.Group();
  innerCap2.add(innerCapSolid2);
  innerCap2.add(innerCapWire2);
  innerCap2.rotation.z = Math.PI / 2;
  innerCap2.position.x = -10; // Mirror of port inner cap
  starboardModule.add(innerCap2);

  const outerCapSolid2 = new THREE.Mesh(capGeo, capSolidMat);
  const outerCapWire2 = new THREE.Mesh(capGeo, capWireMat);
  outerCapWire2.scale.set(1.02, 1.02, 1.02);
  const outerCap2 = new THREE.Group();
  outerCap2.add(outerCapSolid2);
  outerCap2.add(outerCapWire2);
  outerCap2.rotation.z = Math.PI / 2;
  outerCap2.position.x = -28; // Mirror of port outer cap
  starboardModule.add(outerCap2);

  starboardModule.position.y = yPos;
  habitatGroup.add(starboardModule);
});

// Attach all habitat modules to the main station hierarchy
spaceStation.add(habitatGroup);

/* ============================================================================
COMPONENT 5: SOLAR ARRAY ARMS (minimum 4 required)
============================================================================
Four solar array arms attach to the spine at four vertical positions,
two on each side (port and starboard), alternating like the ISS arrays.

Each arm consists of:
1. A horizontal boom extending from the spine
2. Cross-brace rings along the boom — suggesting truss construction
3. Two photovoltaic panels (fore and aft of the boom)

The entire solarGroup has its own rotation on top of the station rotation.
This is a hierarchical transformation — the panels inherit the station's
rotation AND rotate independently to imply sun-tracking.
============================================================================ */
const solarGroup = new THREE.Group();

// The 4 attachment points on the spine
// [yPosition, side] — +1 is port (right), -1 is starboard (left)
// Alternating port/starboard matches real ISS truss layout
const arrayMounts = [
  [45, 1], // Upper port
  [45, -1], // Upper starboard
  [-45, 1], // Lower port
  [-45, -1], // Lower starboard
];

arrayMounts.forEach(([yPos, side]) => {
  const arrayArm = new THREE.Group();

  // 1. Main boom — a thin horizontal cylinder extending from the spine
  // CylinderGeometry by default points along Y axis.
  // rotate it 90 degrees on Z to point along the X axis instead.
  const boomGeo = new THREE.CylinderGeometry(0.4, 0.4, 45, 8);
  const boomSolidMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
  const boomWireMat = new THREE.MeshBasicMaterial({
    color: 0x00f3ff,
    wireframe: true,
  });
  const boomSolid = new THREE.Mesh(boomGeo, boomSolidMat);
  const boomWire = new THREE.Mesh(boomGeo, boomWireMat);
  boomWire.scale.set(1.02, 1.02, 1.02);
  const boom = new THREE.Group();
  boom.add(boomSolid);
  boom.add(boomWire);
  boom.rotation.z = Math.PI / 2; // Point along X axis
  boom.position.x = side * 22.5; // Centre the boom so it extends outward
  arrayArm.add(boom);

  // 2. Cross-brace rings — structural detail along the boom
  // These suggest the boom is a lattice truss, not just a plain cylinder.
  // place 5 rings evenly spaced along the boom length.
  for (let b = -2; b <= 2; b++) {
    const braceGeo = new THREE.TorusGeometry(1.5, 0.2, 6, 12);
    const braceSolidMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const braceWireMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      wireframe: true,
    });
    const braceSolid = new THREE.Mesh(braceGeo, braceSolidMat);
    const braceWire = new THREE.Mesh(braceGeo, braceWireMat);
    braceWire.scale.set(1.02, 1.02, 1.02);
    const brace = new THREE.Group();
    brace.add(braceSolid);
    brace.add(braceWire);
    // Rotate the torus to wrap around the boom (which points along X)
    brace.rotation.x = Math.PI / 2;
    // Space the 5 braces evenly along the boom
    // b goes from -2 to +2, multiply by 8 to spread them out
    brace.position.x = side * (22.5 + b * 8);
    arrayArm.add(brace);
  }

  // 3. Photovoltaic panels — two flat boxes per arm, fore and aft of the boom
  // BoxGeometry(width, height, depth)
  // Very thin on Y (0.15) to represent a flat panel surface
  const panelGeo = new THREE.BoxGeometry(5, 0.15, 24);
  const panelSolidMat = new THREE.MeshBasicMaterial({ color: 0x001133 });
  const panelWireMat = new THREE.MeshBasicMaterial({
    color: 0x0066ff,
    wireframe: true,
  });

  // Fore panel — in front of the boom on the Z axis
  const forePanelSolid = new THREE.Mesh(panelGeo, panelSolidMat);
  const forePanelWire = new THREE.Mesh(panelGeo, panelWireMat);
  forePanelWire.scale.set(1.01, 1.01, 1.01);
  const forePanel = new THREE.Group();
  forePanel.add(forePanelSolid);
  forePanel.add(forePanelWire);
  forePanel.position.x = side * 22.5; // Same X centre as the boom
  forePanel.position.z = 15; // Offset forward on Z
  arrayArm.add(forePanel);

  // Aft panel — behind the boom on the Z axis
  const aftPanelSolid = new THREE.Mesh(panelGeo, panelSolidMat);
  const aftPanelWire = new THREE.Mesh(panelGeo, panelWireMat);
  aftPanelWire.scale.set(1.01, 1.01, 1.01);
  const aftPanel = new THREE.Group();
  aftPanel.add(aftPanelSolid);
  aftPanel.add(aftPanelWire);
  aftPanel.position.x = side * 22.5; // Same X centre as the boom
  aftPanel.position.z = -15; // Offset backward on Z
  arrayArm.add(aftPanel);

  // Panel mounting brackets — small connectors bridging the boom to each panel
  // These are the physical attachment points that make the assembly believable
  // BoxGeometry(width, height, depth)
  const bracketGeo = new THREE.BoxGeometry(1, 1, 6);
  const bracketSolidMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
  const bracketWireMat = new THREE.MeshBasicMaterial({
    color: 0x00f3ff,
    wireframe: true,
  });

  // Fore bracket — connects boom to fore panel
  const foreBracketSolid = new THREE.Mesh(bracketGeo, bracketSolidMat);
  const foreBracketWire = new THREE.Mesh(bracketGeo, bracketWireMat);
  foreBracketWire.scale.set(1.02, 1.02, 1.02);
  const foreBracket = new THREE.Group();
  foreBracket.add(foreBracketSolid);
  foreBracket.add(foreBracketWire);
  foreBracket.position.x = side * 22.5; // Aligned with boom centre
  foreBracket.position.z = 6; // Bridges gap to fore panel
  arrayArm.add(foreBracket);

  // Aft bracket — connects boom to aft panel
  const aftBracketSolid = new THREE.Mesh(bracketGeo, bracketSolidMat);
  const aftBracketWire = new THREE.Mesh(bracketGeo, bracketWireMat);
  aftBracketWire.scale.set(1.02, 1.02, 1.02);
  const aftBracket = new THREE.Group();
  aftBracket.add(aftBracketSolid);
  aftBracket.add(aftBracketWire);
  aftBracket.position.x = side * 22.5; // Aligned with boom centre
  aftBracket.position.z = -6; // Bridges gap to aft panel
  arrayArm.add(aftBracket);

  arrayArm.position.y = yPos; // Mount at the correct height on the spine
  solarGroup.add(arrayArm);
});

// Attach the solar group to the station hierarchy.
// Because solarGroup is a child of spaceStation, it inherits the station's
// rotation. In the animation loop there is extra rotation added on top of this,
// which is what creates the independent sun-tracking movement.
spaceStation.add(solarGroup);

/* ============================================================================
COMPONENT 6: COMMUNICATION TOWERS (minimum 2 required)
============================================================================
Two communication towers sit at the top and bottom ends of the spine.
Each tower has a base plate, a telescoping mast, a parabolic dish,
and a beacon tip.

The buildTower function builds both towers from a single definition.
Passing isTop=true builds the top tower. isTop=false builds the bottom
tower — the direction multiplier (dir) flips all Y positions so the
bottom tower is a perfect mirror of the top without duplicating code.
============================================================================ */
const commsGroup = new THREE.Group();

const buildTower = (isTop) => {
    const tower = new THREE.Group();

    // Direction multiplier — +1 for top tower, -1 for bottom tower.
    // Multiplying all Y positions by dir means the bottom tower is
    // automatically a vertical mirror of the top.
    const dir = isTop ? 1 : -1;

    // 1. Base mounting plate — wide flat cylinder that sits flush
    // on the end of the spine, like a bolted flange connection.
    // CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
    const baseGeo = new THREE.CylinderGeometry(4, 4, 2, 16);
    const baseSolidMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const baseWireMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, wireframe: true });
    const baseSolid = new THREE.Mesh(baseGeo, baseSolidMat);
    const baseWire = new THREE.Mesh(baseGeo, baseWireMat);
    baseWire.scale.set(1.02, 1.02, 1.02);
    const base = new THREE.Group();
    base.add(baseSolid);
    base.add(baseWire);
    base.position.y = dir * 1; // Sit flush at the spine end
    tower.add(base);

    // 2. Telescoping mast — 3 stacked cylinders of decreasing radius.
    // This gives the impression of a multi-stage extendable antenna mast.
    // Each segment is narrower than the one below it.
    const mastSegments = [
        { radiusTop: 1.4, radiusBottom: 1.8, height: 12, y: dir * 8  },
        { radiusTop: 0.9, radiusBottom: 1.2, height: 10, y: dir * 19 },
        { radiusTop: 0.4, radiusBottom: 0.8, height: 8,  y: dir * 28 },
    ];

    mastSegments.forEach(({ radiusTop, radiusBottom, height, y }) => {
        const mastGeo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 10);
        const mastSolidMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
        const mastWireMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, wireframe: true });
        const mastSolid = new THREE.Mesh(mastGeo, mastSolidMat);
        const mastWire = new THREE.Mesh(mastGeo, mastWireMat);
        mastWire.scale.set(1.02, 1.02, 1.02);
        const mast = new THREE.Group();
        mast.add(mastSolid);
        mast.add(mastWire);
        mast.position.y = y;
        tower.add(mast);
    });

    // 3. Parabolic dish — a cone tilted at 45 degrees.
    // Real station dishes tilt to maintain lock on Earth or satellites.
    // ConeGeometry(radius, height, radialSegments)
    const dishGeo = new THREE.ConeGeometry(5, 3, 20);
    const dishSolidMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const dishWireMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, wireframe: true });
    const dishSolid = new THREE.Mesh(dishGeo, dishSolidMat);
    const dishWire = new THREE.Mesh(dishGeo, dishWireMat);
    dishWire.scale.set(1.02, 1.02, 1.02);
    const dish = new THREE.Group();
    dish.add(dishSolid);
    dish.add(dishWire);
    dish.position.y = dir * 34;
    // Tilt the dish outward at 45 degrees — scanning position
    // The tilt direction flips between top and bottom tower
    dish.rotation.x = isTop ? Math.PI / 4 : -Math.PI / 4;
    tower.add(dish);

    // 4. Beacon tip — small sphere at the very top of the mast.
    // Represents the navigational beacon light on real stations.
    // Coloured cyan to match the primary structural colour language.
    const beaconGeo = new THREE.SphereGeometry(0.8, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = dir * 38; // Very tip of the mast
    tower.add(beacon);

    // Position the whole tower at the end of the spine.
    // The spine is 120 units tall so its tips are at Y = +60 and Y = -60
    tower.position.y = dir * 60;

    return tower;
};

commsGroup.add(buildTower(true));  // Top tower
commsGroup.add(buildTower(false)); // Bottom tower — automatically mirrored
spaceStation.add(commsGroup);

/* ============================================================================
COMPONENT 6: THE FLEET (Dynamic Spacecraft)
============================================================================
*/
for (let i = 0; i < 4; i++) {
  const shipGroup = new THREE.Group();

  // 1. Fuselage
  const fuseGeo = new THREE.CylinderGeometry(1, 1, 5, 16);
  const fuseMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const fuseWireMat = new THREE.MeshBasicMaterial({
    color: 0xff4d00,
    wireframe: true,
  });
  const fuseWire = new THREE.Mesh(fuseGeo, fuseWireMat);
  fuseWire.scale.set(1.05, 1.05, 1.05);
  const fuselage = new THREE.Mesh(fuseGeo, fuseMat);
  fuselage.add(fuseWire);
  fuselage.rotation.x = Math.PI / 2; // Lay the cylinder flat

  // 2. Nose cone
  const noseGeo = new THREE.ConeGeometry(1, 3, 16);
  const noseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.z = -4; // Push to the front (Negative Z is 'forward' in Three.js)
  nose.rotation.x = -Math.PI / 2; // Point forward

  // 3. Engine Thruster Glow
  const engineGeo = new THREE.SphereGeometry(0.8, 8, 8);
  const engineMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff }); // cyan energy
  const engine = new THREE.Mesh(engineGeo, engineMat);
  engine.position.z = 2.5; // Push to the back
  engine.scale.z = 2.5; // Stretch it backward to look like a propulsion flame

  shipGroup.add(fuselage);
  shipGroup.add(nose);
  shipGroup.add(engine);

  // add the ships directly to the scene, not the spaceStation.
  // If we added them to the station, they would inherit the station's rotation, ruining their independent orbit.
  scene.add(shipGroup);
  fleet.push(shipGroup);
}

/* ============================================================================
    EVENT LISTENERS & ANIMATION LOOP
============================================================================
*/

window.addEventListener("resize", () => {
  // 1. Update camera aspect ratio
  camera.aspect = window.innerWidth / window.innerHeight;
  // 2. Update camera projection matrix
  camera.updateProjectionMatrix();
  // 3. Update renderer size
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Listens for 'p' to pause/resume, and 'v' to change camera views
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "p") {
    isOrbiting = !isOrbiting;
  }

  if (e.key.toLocaleLowerCase() === "v") {
    isExternalView = !isExternalView;
    if (isExternalView) {
      // External View: Pull back to see the whole stationS
      camera.position.set(0, 30, 150);
      controls.target.set(0, 0, 0);
    } else {
      // First-Person View: Teleport inside the first docking ring
      // The ring is at x = 22, so we place the camera at x = 20
      camera.position.set(20, 0, 0);
      // Look straight out into the starfield (towards positive X)
      controls.target.set(20.1, 0, 0);
    }
  }
});

const animate = (time) => {
  // Only increment time if teh game is not paused (Fulfills animation control criteria)
  if (isOrbiting) {
    currentOrbitTime += 16.6;
    // Slowly rotate the massive station on multiple axes
    spaceStation.rotation.y += 0.002;
    spaceStation.rotation.x += 0.0001;
    spaceStation.rotation.z += 0.0001;
  }

  // Solar panels rotate independently on Y — implies sun-tracking
  // This rotation is relative to the station, not the world
  solarGroup.rotation.y += 0.005;

  // Orbital physics for the fleet
  const orbitSpeed = 0.0005;
  const orbitRadius = 70; // Fly in a wide perimeter around the solar arrays

  fleet.forEach((ship, index) => {
    // Space them out evenly (360 degrees / 4 ships)
    const angleOffset = (index / fleet.length) * Math.PI * 2;
    const currentAngle = currentOrbitTime * orbitSpeed + angleOffset;

    // Apply Trigonometric Translation
    ship.position.x = Math.cos(currentAngle) * orbitRadius;
    ship.position.z = Math.sin(currentAngle) * orbitRadius;

    // Make the ship face its flight path
    // A circle's tangent is exactly 90 degrees (PI/2) ahead of its angle
    ship.rotation.y = -currentAngle;
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};
requestAnimationFrame(animate);
