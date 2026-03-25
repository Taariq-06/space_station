import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- STATE MANAGEMENT ---
const fleet = []; // Array to track all orbiting spacecraft
let isOrbiting = true; // State toggle for the pause/resume requirement
let currentOrbitTime = 0; // Independent time tracker for smooth pausing
let isExternalView = true; // Tracks current camera mode

// --- SCENE SETUP ---
const canvas = document.querySelector("#c");
const scene = new THREE.Scene();

// A dark background, but not pure black, to allow the darkest station parts to be visible
scene.background = new THREE.Color('#020205');


// --- CAMERA SETUP (Perspective Projection Requirement) ---
// 75 degree FOV, matching browser aspect ratio, near clipping at 0.1, far at 2000 to see distant stars
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 
    0.1, 2000);
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
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5});
const starVertices = [];

for (let i = 0; i < 2000; i++) {
    const x = (Math.random() - 0.5) * 1000;
    const y = (Math.random() - 0.5) * 1000;
    const z = (Math.random() - 0.5) * 1000;
    starVertices.push(x, y, z);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
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
const coreGeometry = new THREE.SphereGeometry(15, 32, 16);
const coreSolidMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
const coreSolid = new THREE.Mesh(coreGeometry, coreSolidMaterial);

// 2. The Wireframe Overlay (Neon Cyan)
// Scale it up by 1% (1.01) so it sits perfectly on the surface of the solid base without Z-fighting (flickering)
const coreWireMaterial = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true });
const coreWire = new THREE.Mesh(coreGeometry, coreWireMaterial);
coreWire.scale.set(1.01, 1.01, 1.01);

// 3. Top and Bottom Bulkheads (Caps)
const bulkheadGeometry = new THREE.CylinderGeometry(12, 12, 4, 32);
const bulkheadMaterial = new THREE.MeshBasicMaterial( { color: 0x050505 });
const bulkheadWireMaterial = new THREE.MeshBasicMaterial( { color: 0x00f3ff, wireframe: true });

// Top Bulk Bulkhead
const topBulkhead = new THREE.Mesh(bulkheadGeometry, bulkheadMaterial);
const topBulkheadWire = new THREE.Mesh(bulkheadGeometry, bulkheadWireMaterial);
topBulkheadWire.scale.set(1.01, 1.01, 1.01);
topBulkhead.add(topBulkheadWire); // Group wireframe to solid
topBulkhead.position.y = 14; // Position at the top of the sphere

// Bottom Bulkhead
const bottomBulkhead = new THREE.Mesh(bulkheadGeometry, bulkheadMaterial);
const bottomBulkheadWire = new THREE.Mesh(bulkheadGeometry, bulkheadWireMaterial);
bottomBulkheadWire.scale.set(1.01, 1.01, 1.01);
bottomBulkhead.add(bottomBulkheadWire); // Group wireframe to solid
bottomBulkhead.position.y = -14; // Position at the bottom of the sphere

// Assemble the Core
coreGroup.add(coreSolid);
coreGroup.add(coreWire);
coreGroup.add(topBulkhead);
coreGroup.add(bottomBulkhead);

// Add the completed core to the main station hierarchy
spaceStation.add(coreGroup);

window.addEventListener('resize', () => {
    // 1. Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    // 2. Update camera projection matrix
    camera.updateProjectionMatrix();
    // 3. Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
});
 
// render (animation loop). This will create a loop that causes the renderer to draw the scene every time the screen is refreshed 
const animate = time => {

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);


