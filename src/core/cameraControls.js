/**
 * CameraControls.js
 * -----------------
 * Sets up and manages all camera behaviour:
 *   - OrbitControls (mouse orbit, scroll zoom)
 *   - WASD / Q / E free-roam movement
 *   - V key view switching (external orbit ↔ first-person docking)
 *
 * Returns { update, setExternalView, setDockingView } so SceneManager
 * can call update() every frame and trigger view switches on keydown.
 *
 * @param {THREE.PerspectiveCamera} camera   - The main scene camera
 * @param {THREE.WebGLRenderer}     renderer - The WebGL renderer
 * @returns {{ update: function, setExternalView: function, setDockingView: function }}
 */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function createCameraControls(camera, renderer) {

    // --- OrbitControls setup ---
    // Provides mouse orbit, scroll zoom, and right-click pan
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;  // Smooth deceleration after releasing mouse
    controls.dampingFactor = 0.03;  // Lower = more cinematic glide
    controls.minDistance   = 10;    // Cannot clip inside the station
    controls.maxDistance   = 500;   // Cannot zoom out beyond the starfield

    // Tracks which movement keys are currently held down
    // Keydown sets true, keyup sets false — checked every frame in update()
    const keys = { w: false, a: false, s: false, d: false, q: false, e: false };

    const MOVE_SPEED = 0.8; // Units moved per frame — consistent regardless of hardware

    /* -------------------------------------------------------------------------
    VIEW SWITCHING
    External view — pulls back to see the full station
    Docking view  — positions camera outside the upper port habitat module,
                    looking inward toward the core (approach-to-dock perspective)
    ------------------------------------------------------------------------- */

    const setExternalView = () => {
        camera.position.set(0, 30, 150);
        controls.target.set(0, 0, 0);
        controls.update();
    };

    const setDockingView = () => {
        // Positioned at X=55, Y=30 — outside the upper port habitat module
        // Looking toward the core at (0, 30, 0) simulates approach-to-dock
        camera.position.set(55, 30, 0);
        controls.target.set(0, 30, 0);
        controls.update();
    };

    /* -------------------------------------------------------------------------
    KEY TRACKING
    Exposed as registerKey() so SceneManager can call it from its
    keydown/keyup listeners without this file touching the DOM directly.
    ------------------------------------------------------------------------- */

    // Called by SceneManager on keydown — sets the key state to true
    const onKeyDown = (key) => {
        if (key in keys) keys[key] = true;
    };

    // Called by SceneManager on keyup — sets the key state to false
    const onKeyUp = (key) => {
        if (key in keys) keys[key] = false;
    };

    /* -------------------------------------------------------------------------
    UPDATE — called every frame by SceneManager
    Moves the camera relative to its own orientation so W always means
    forward in the direction the camera is looking, not a fixed world axis.
    ------------------------------------------------------------------------- */

    const update = () => {

        // Only run movement calculations if a key is held down
        if (keys.w || keys.s || keys.a || keys.d || keys.e || keys.q) {

            // Forward vector — direction the camera is currently facing
            const forward = new THREE.Vector3();
            camera.getWorldDirection(forward);

            // Right vector — perpendicular to forward and world up (Y axis)
            // crossVectors computes this mathematically
            const right = new THREE.Vector3();
            right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

            if (keys.w) camera.position.addScaledVector(forward,  MOVE_SPEED);
            if (keys.s) camera.position.addScaledVector(forward, -MOVE_SPEED);
            if (keys.d) camera.position.addScaledVector(right,    MOVE_SPEED);
            if (keys.a) camera.position.addScaledVector(right,   -MOVE_SPEED);
            if (keys.e) camera.position.y += MOVE_SPEED; // Up — world Y axis
            if (keys.q) camera.position.y -= MOVE_SPEED; // Down — world Y axis

            // Keep OrbitControls target in sync with WASD movement.
            // Without this, OrbitControls fights against free-roam by trying
            // to orbit around the original target point.
            controls.target.addScaledVector(
                forward,
                (keys.w ? MOVE_SPEED : 0) - (keys.s ? MOVE_SPEED : 0)
            );
        }

        // Must be called every frame when damping is enabled
        controls.update();
    };

    return { update, setExternalView, setDockingView, onKeyDown, onKeyUp };
}