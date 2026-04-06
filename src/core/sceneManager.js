/**
 * SceneManager.js
 * ---------------
 * The central coordinator of the application.
 * Responsible for:
 *   - Creating the Three.js scene, camera, and renderer
 *   - Initialising all scene components
 *   - Running the animation loop
 *   - Handling all DOM event listeners
 *
 * This file knows about all components but components do not
 * know about each other — dependencies flow in one direction only.
 */

import * as THREE from "three";
import { createStarfield } from "../components/starfield.js";
import { createStation } from "../components/station.js";
import { createFleet } from "../components/fleet.js";
import { createLighting } from "../components/lighting.js";
import { createCameraControls } from "./cameraControls.js";

export class SceneManager {
  /**
   * @param {HTMLCanvasElement} canvas - The canvas element to render into
   */
  constructor(canvas) {
    // --- Scene ---
    // Dark navy background — not pure black so the darkest wireframe
    // elements remain visible against it
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#020205");

    // --- Camera (Perspective Projection) ---
    // 75 degree FOV mimics the human eye. Near clipping at 0.1 avoids
    // geometry disappearing when close. Far at 2000 keeps stars visible.
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000,
    );
    this.camera.position.set(0, 30, 150); // Above and behind for good opening angle

    // --- Renderer ---
    this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // --- State ---
    this.isOrbiting = true; // Pause/resume flag — toggled by P key
    this.isExternalView = true; // Camera mode flag — toggled by V key
    this.orbitClock = 0; // Time accumulator for ship orbital movement

    // --- Initialise components ---
    this._initComponents();

    // --- Event listeners ---
    this._initEventListeners();

    // --- Start animation loop ---
    this._animate();
  }

  /* -------------------------------------------------------------------------
    COMPONENT INITIALISATION
    Each create function receives what it needs and returns what SceneManager
    needs to call each frame. Components do not know about each other.
    ------------------------------------------------------------------------- */

  _initComponents() {
    // Starfield — static, no update needed
    createStarfield(this.scene);

    // Lighting - returns light references for toggling and searchlight animation
    const lighting = createLighting(this.scene);
    this.sunLight = lighting.sunLight;
    this.searchlight = lighting.searchlight;
    this.toggleDayEclipse = lighting.toggleDayEclipse;

    // Station — returns spaceStation group and solarGroup for animation
    const {
      spaceStation,
      solarGroup,
      setShadingMode,
      cubeCamera,
      beaconMeshes,
    } = createStation(this.scene, this.renderer);
    this.cubeCamera = cubeCamera;
    this.beaconMeshes = beaconMeshes;
    this.spaceStation = spaceStation;
    this.solarGroup = solarGroup;
    this.setShadingMode = setShadingMode;
    this.shadingModes = ["phong", "flat", "gouraud"]; // Cycle order
    this.shadingIndex = 0; // Start on Phong

    // Fleet — returns update() for orbital animation
    const fleet = createFleet(this.scene);
    this.fleetUpdate = fleet.update;

    // Camera controls — returns update(), view switchers, and key handlers
    const cam = createCameraControls(this.camera, this.renderer);
    this.cameraUpdate = cam.update;
    this.setExternalView = cam.setExternalView;
    this.setDockingView = cam.setDockingView;
    this.cameraOnKeyDown = cam.onKeyDown;
    this.cameraOnKeyUp = cam.onKeyUp;
  }

  /* -------------------------------------------------------------------------
    EVENT LISTENERS
    All DOM interaction lives here — components never touch the DOM directly.
    ------------------------------------------------------------------------- */

  _initEventListeners() {
    // Resize — keeps camera aspect ratio and renderer size in sync
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();

      // P — pause / resume all spacecraft
      if (key === "p") this.isOrbiting = !this.isOrbiting;

      // V — toggle between external orbit and first-person docking view
      if (key === "v") {
        this.isExternalView = !this.isExternalView;
        this.isExternalView ? this.setExternalView() : this.setDockingView();
      }

      // L — toggle between day and eclipse lighting
      if (key === "l") this.toggleDayEclipse();

      // G — cycle through shading models (Phong → Flat → Gouraud → Phong)
      if (key === "g") {
        this.shadingIndex = (this.shadingIndex + 1) % this.shadingModes.length;
        const mode = this.shadingModes[this.shadingIndex];
        this.setShadingMode(mode);
        console.log(`Shading mode: ${mode}`); // Visible confirmation in browser console
      }

      // WASD / Q / E — pass to camera controls for free-roam movement
      this.cameraOnKeyDown(key);
    });

    window.addEventListener("keyup", (e) => {
      // Pass key release to camera controls to stop movement
      this.cameraOnKeyUp(e.key.toLowerCase());
    });
  }

  /* -------------------------------------------------------------------------
    ANIMATION LOOP
    Called every frame via requestAnimationFrame (~60fps).
    Advances all animated components then renders the frame.
    ------------------------------------------------------------------------- */

  _animate() {
    requestAnimationFrame(() => this._animate());

    if (this.isOrbiting) {
      // Advance the time accumulator — drives all orbital movement
      this.orbitClock += 16.6;
      // Station slow rotation — multi-axis gives a natural drift
      this.spaceStation.rotation.y += 0.002;
      this.spaceStation.rotation.x += 0.0001;
      this.spaceStation.rotation.z += 0.0001;

      // Solar panels rotate independently — implies sun-tracking
      // This is a hierarchical transform — solarGroup inherits station
      // rotation AND adds its own on top
      this.solarGroup.rotation.y += 0.005;

      // Update cube camera — captures live scene for sphere environment reflection
      this.cubeCamera.update(this.renderer, this.scene);
      // Update beacon shader time uniform — drives the pulse animation
      const elapsedTime = this.orbitClock / 1000;
      this.beaconMeshes.forEach((beacon) => {
        beacon.material.uniforms.uTime.value = elapsedTime;
      });

      // Rotate searchlight target around the station on the XZ plane
      const searchAngle = this.orbitClock * 0.0008;
      this.searchlight.target.position.set(
        Math.cos(searchAngle) * 40,
        0,
        Math.sin(searchAngle) * 40,
      );
      this.searchlight.target.updateMatrixWorld(); // Required for spotlight target movement
    }

    // Fleet update — handles orbital movement and ship facing direction
    // Receives orbitClock and isOrbiting so it can manage its own pause state
    this.fleetUpdate(this.orbitClock, this.isOrbiting);

    // Camera update — handles WASD movement and OrbitControls damping
    this.cameraUpdate();

    // Render the frame
    this.renderer.render(this.scene, this.camera);
  }
}
