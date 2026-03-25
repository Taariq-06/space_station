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
const coreWireMaterial = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true});
const coreWire = new THREE.Mesh(coreGeometry, coreWireMaterial);
coreWire.scale.set(1.01, 1.01, 1.01);

// Assemble the Core
coreGroup.add(coreSolid);
coreGroup.add(coreWire);

spaceStation.add(coreGroup);

// 3. Junction collars — where the sphere meets the spine above and below.
// These tapered cylinders suggest the sphere is physically bolted onto
// the truss backbone, rather than just floating around it.
// CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
// Notice radiusTop is smaller than radiusBottom — this creates the taper.
const collarGeo = new THREE.CylinderGeometry(3, 6, 6, 16);
const collarSolidMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
const collarWireMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true });

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
const spineWireMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true });

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
    const collarWireMat = new THREE.MeshBasicMaterial( {color: 0x00f3ff, wireframe: true });

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
   COMPONENT 4: THE DOCKING HUB
   ============================================================================
*/
const dockingGroup = new THREE.Group();

//1. The Main Ring (Ties the modules to the core)
const ringGeometry = new THREE.TorusGeometry(22, 1.5, 16, 64);
const ringSolidMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
const ringWireMaterial = new THREE.MeshBasicMaterial({
  color: 0xff4d00,
  wireframe: true,
});
const ringSolid = new THREE.Mesh(ringGeometry, ringSolidMaterial);
const ringWire = new THREE.Mesh(ringGeometry, ringWireMaterial);
ringWire.scale.set(1.01, 1.01, 1.01);

// The Torus renders vertically by default. We rotate it 90 degrees (PI/2) to lay flat on the XZ plane.
ringSolid.rotation.x = Math.PI / 2;
ringWire.rotation.x = Math.PI / 2;
dockingGroup.add(ringSolid);
dockingGroup.add(ringWire);

// 2. The 6 Docking Modules
for (let i = 0; i < 6; i++) {
  const moduleGroup = new THREE.Group();

  // Module base and wireframe overlay (Warninig Orange)
  const modGeo = new THREE.CylinderGeometry(2.5, 2.5, 8, 16);
  const modSolidMaterial = new THREE.MeshBasicMaterial({ color: 0x050505 });
  const modWireMaterial = new THREE.MeshBasicMaterial({
    color: 0xff4d00,
    wireframe: true,
  });
  const modSolid = new THREE.Mesh(modGeo, modSolidMaterial);
  const modWire = new THREE.Mesh(modGeo, modWireMaterial);
  modWire.scale.set(1.02, 1.02, 1.02); // Slightly larger to avoid Z-fighting

  moduleGroup.add(modSolid);
  moduleGroup.add(modWire);

  // Trigonometry to distribute 6 modules evenly around the 360-degree (2 * PI) ring
  const angle = (i / 6) * Math.PI * 2;
  const distance = 22; // Matches the Torus radius so they sit exactly on the ring

  moduleGroup.position.x = Math.cos(angle) * distance;
  moduleGroup.position.z = Math.sin(angle) * distance;

  // Rotate the cylinders so they point outward like spokes on a wheel
  moduleGroup.rotation.x = Math.PI / 2;
  moduleGroup.rotation.z = angle;

  dockingGroup.add(moduleGroup);
}
// Attach the entire docking assembly to the main station
spaceStation.add(dockingGroup);

/* ============================================================================
   COMPONENT 4: THE SOLAR ARRAYS
   ============================================================================
*/
const solarGroup = new THREE.Group();

for (let i = 0; i < 4; i++) {
  const panelArm = new THREE.Group();

  // 1. Central Mast
  const mastGeo = new THREE.CylinderGeometry(0.5, 0.5, 30, 8);
  const mastSolidMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
  const mastSolid = new THREE.Mesh(mastGeo, mastSolidMaterial);
  panelArm.add(mastSolid);

  // 2. The Photovoltaic Panels (Deep blue with Electric Blue wireframe)
  const panelGeo = new THREE.BoxGeometry(8, 0.2, 26);
  const panelSolidMaterial = new THREE.MeshBasicMaterial({ color: 0x001133 });
  const panelWireMaterial = new THREE.MeshBasicMaterial({
    color: 0x0066ff,
    wireframe: true,
  });
  const panelSolid = new THREE.Mesh(panelGeo, panelSolidMaterial);
  const panelWire = new THREE.Mesh(panelGeo, panelWireMaterial);
  panelWire.scale.set(1.01, 1.01, 1.01);

  // Group the solid panel and wireframe together
  const panelComposite = new THREE.Group();
  panelComposite.add(panelSolid);
  panelComposite.add(panelWire);

  // Add the panel composite to the arm
  panelArm.add(panelComposite);

  // Distribute the 4 arrays evenly
  const angle = (i / 4) * Math.PI * 2;
  const distance = 40; // Push these further out past the docking ring

  panelArm.position.x = Math.cos(angle) * distance;
  panelArm.position.z = Math.sin(angle) * distance;

  // Rotate the arm to point outward
  panelArm.rotation.x = Math.PI / 2;
  panelArm.rotation.z = angle;

  // Tilt the panels themselves 30 dgrees (PI/6) on their Y axis for a dynamic, deployed look
  panelComposite.rotation.y = Math.PI / 6;

  solarGroup.add(panelArm);
}
// Attach the arrays to the man station
spaceStation.add(solarGroup);

/* ============================================================================
   COMPONENT 5: THE COMMS TOWERS
   ============================================================================
*/
const commsGroup = new THREE.Group();

// Tower Geometries
const baseGeo = new THREE.CylinderGeometry(1.5, 2.5, 8, 16);
const antennaGeo = new THREE.CylinderGeometry(0.2, 0.2, 12, 8);
const dishGeo = new THREE.ConeGeometry(3, 2, 16);

// Materials (Using brighter accents to simulate navigational beacons)
const baseMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
const accentMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 }); // Warning Yellow
const commsWireMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: true,
});

// Use a function to build the towers to keep the codebase DRY ( Don't Repeat Yourself)
const buildTower = (isTop) => {
  const tower = new THREE.Group();

  // 1. The Base
  const base = new THREE.Mesh(baseGeo, baseMat);
  const baseWire = new THREE.Mesh(baseGeo, commsWireMat);
  baseWire.scale.set(1.02, 1.02, 1.02);
  base.add(baseWire);
  base.position.y = 4; // Shift up so the bottom resrs on the core

  // 2. The Antenna Mast
  const antenna = new THREE.Mesh(antennaGeo, accentMat);
  antenna.position.y = 14;

  // 3. The Transmitter Dish
  const dish = new THREE.Mesh(dishGeo, baseMat);
  const dishWire = new THREE.Mesh(dishGeo, commsWireMat);
  dishWire.scale.set(1.05, 1.05, 1.05);
  dish.add(dishWire);
  dish.position.y = 20;
  dish.rotation.x = Math.PI / 2; // Tilt outward to scan deep space

  tower.add(base);
  tower.add(antenna);
  tower.add(dish);

  // Position the entire tower group
  if (isTop) {
    tower.position.y = 16; // Rest on the top bulkhead
  } else {
    tower.position.y = -16; // Rest on the bottom bulkkhead
    tower.rotation.x = Math.PI; // Flip exactly 180 degrees upside down
  }
  return tower;
};
commsGroup.add(buildTower(true));
commsGroup.add(buildTower(false));
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
    spaceStation.rotation.x += 0.0005;
    spaceStation.rotation.z += 0.0005;
  }

  // Orbital physics for the fleet
  const orbitSpeed = 0.0005;
  const orbitRadius = 70; // Fly in a wide perimeter around the solar arrays

  fleet.forEach((ship, index) => {
    // Space them out evenly (360 degrees / 4 ships)
    const angleOffset = (index / fleet.length) * Math.PI * 2;
    const currentAngle = (currentOrbitTime * orbitSpeed) + angleOffset;

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
