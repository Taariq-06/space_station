import * as THREE from 'three';

const canvas = document.querySelector("#c");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 
    0.1, 1000); // Set up camera

// Set up renderer
const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
renderer.setSize(window.innerWidth, window.innerHeight); // use the width and height of the browser to render the app

camera.position.z = 40; // Move the camera out

// Add the SpaceStation to the scene to be rendered
const spaceStation = new THREE.Group();
scene.add(spaceStation);

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

// render (animation loop). This will create a loop that causes the renderer to draw the scene every time the screen is refreshed 
const animate = time => {
    spaceStation.rotation.x = time / 2000;
    spaceStation.rotation.y = time / 1000;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);


