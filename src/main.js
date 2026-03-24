import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


const fleet = []; // Keeps track of ships
let isOrbiting = true; // Tracks if the game is paused
let currentOrbitTime = 0; // Custom time tracker
const canvas = document.querySelector("#c");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 
    0.1, 1000); // Set up camera

// Set up renderer
const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
renderer.setSize(window.innerWidth, window.innerHeight); // use the width and height of the browser to render the app

camera.position.z = 40; // Move the camera out

// instantiate the controls and pass in the camera and the canvas element so it knows what to listen to for mouse events
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05; // Gives it that cinematic, smooth glide

// Add the SpaceStation to the scene to be rendered
const spaceStation = new THREE.Group();
scene.add(spaceStation);

// Create placeholder ships
 for (let i = 0; i < 4; i++) {
    const shipGeometry = new THREE.ConeGeometry(1, 3, 8);
    const shipMaterial = new THREE.MeshBasicMaterial({color: "#fb8500", wireframe: true});
    const ship = new THREE.Mesh(shipGeometry, shipMaterial);
    
    ship.rotation.x = Math.PI / 2;
    scene.add(ship); // add to the scene, not spaceStation

    // add Ship to the fleet array
    fleet.push(ship);
 }

// Create the central core
const centralCoreGeometry = new THREE.SphereGeometry(15, 32, 16);
const centralCoreMaterial = new THREE.MeshBasicMaterial({color: 0x2A3439, wireframe: true});
const centralCore = new THREE.Mesh(centralCoreGeometry, centralCoreMaterial);
spaceStation.add(centralCore);

// Create the Comms Towers
const commsTower1Geometry = new THREE.CylinderGeometry(1.5, 1.5, 20, 32);
const commsTower1Material = new THREE.MeshBasicMaterial({color: 0xffff00, wireframe: true });
const commsTower1 = new THREE.Mesh(commsTower1Geometry, commsTower1Material);
commsTower1.position.y = 25;
spaceStation.add(commsTower1);

const commsTower2Geometry = new THREE.CylinderGeometry(1.5, 1.5, 20, 32);
const commsTower2Material = new THREE.MeshBasicMaterial({color: 0xffff00, wireframe: true });
const commsTower2 = new THREE.Mesh(commsTower2Geometry, commsTower2Material);
commsTower2.position.y = -25;
spaceStation.add(commsTower2);

// Create the 6 docking modules
for (let i = 0; i < 6; i++) {
    const dockingModuleGeometry = new THREE.CylinderGeometry(2, 2, 10, 16);
    const dockingModuleMaterial = new THREE.MeshBasicMaterial({ color: "#219ebc", wireframe: true});
    const dockingModule = new THREE.Mesh(dockingModuleGeometry, dockingModuleMaterial);
    /* 
    To position them in a circle around the core, we calculate the angle for each module, 
    and then use Sine and Cosine to find the X and Z coordinates. 
    */
   const angle = (i / 6) * Math.PI * 2; // Divides a full circle (2 PI) into 6 slices
   const distance = 20; // How far out from the center they should sit

   dockingModule.position.x = Math.cos(angle) * distance;
   dockingModule.position.z = Math.sin(angle) * distance;

   // Rotata the cylinder so it points outward instead of straight up
   dockingModule.rotation.x = Math.PI / 2; // Tip it 90 degrees on the X axis
   dockingModule.rotation.z = angle; // Point it outward

   spaceStation.add(dockingModule);
}

// Create the 4 solar Panels
for (let i = 0; i < 4; i++) {
    const solarPanelsGeometry = new THREE.BoxGeometry(15, 0.5, 10);
    const solarPanelsMaterial = new THREE.MeshBasicMaterial({ color: "#219ebc", wireframe: true});
    const solarPanels = new THREE.Mesh(solarPanelsGeometry, solarPanelsMaterial);
    /* 
    To position them in a circle around the core, we calculate the angle for each module, 
    and then use Sine and Cosine to find the X and Z coordinates. 
    */
   const angle = (i / 4) * Math.PI * 2; // Divides a full circle (2 PI) into 4 slices
   const distance = 35; // How far out from the center they should sit

   solarPanels.position.x = Math.cos(angle) * distance;
   solarPanels.position.z = Math.sin(angle) * distance;

   // Rotata the cylinder so it points outward instead of straight up
   solarPanels.rotation.x = Math.PI / 2; // Tip it 90 degrees on the X axis
   solarPanels.rotation.z = angle; // Point it outward

   spaceStation.add(solarPanels);
}

window.addEventListener('resize', () => {
    // 1. Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    // 2. Update camera projection matrix
    camera.updateProjectionMatrix();
    // 3. Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
});
 
// listens for the "p" key yo toggle the pause state
window.addEventListener("keydown", e =>{
    if (e.key.toLowerCase() === "p") {
        isOrbiting = !isOrbiting; // Flips true to false, or false to true
        console.log("Orbiting active:", isOrbiting); // Helpful for debugging
    }
});
// render (animation loop). This will create a loop that causes the renderer to draw the scene every time the screen is refreshed 
const animate = time => {

    // increase our custom time if we are not paused
    // (We add 16.6 milliseconds, which is roughly the time of one frame at 60FPS)
    if (isOrbiting) {
        currentOrbitTime += 16.6;
    }
    // Orbital physics for the fleet
    const orbitSpeed = 0.0001; // How fast they fly
    const orbitRadius = 60; // How far out they fly

    fleet.forEach((ship, index) => {
        // Add an offset so they don't all clump together (spaces them out by 90 degrees)
        const angleOffset = (index / fleet.length) * Math.PI * 2;
        const currentAngle = (currentOrbitTime * orbitSpeed) + angleOffset;

        // calculate new position
        ship.position.x = Math.cos(currentAngle) * orbitRadius;
        ship.position.z = Math.sin(currentAngle) * orbitRadius;

        // make the ship face the direction is is flying
        // A circle's tangent is exactly 90 degrees (PI/2) ahead of its current angle
        ship.rotation.y = -currentAngle;
    });
    spaceStation.rotation.x = time / 2000;
    spaceStation.rotation.y = time / 1000;

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);


