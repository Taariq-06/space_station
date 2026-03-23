import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 
    0.1, 1000); // Set up camera

// Set up renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight); // use the width and height of the browser to render the app
document.body.appendChild(renderer.domElement); // add the renderer element to our HTML

//Create 3D Cube
const geometry = new THREE.BoxGeometry(1,1,1);
const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5; // Move the camera out

// update the camera's aspect ratio and the renderer's size whenever the window is resized
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
    //rotate cube
    cube.rotation.x = time / 2000;
    cube.rotation.y = time / 1000;
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);