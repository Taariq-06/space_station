import * as THREE from "three";

/**
 * Lighting.js
 * -----------
 * Creates and configures all scene lights for Assessment 4.
 * Three light types are used:
 *   - DirectionalLight  : sun (day and eclipse modes)
 *   - PointLight        : docking bay and window beacons
 *   - SpotLight         : docking guidance and rotating searchlight
 *
 * Returns references so SceneManager can toggle and animate lights.
 *
 * @param {THREE.Scene} scene
 * @returns {{ sunLight, eclipseLight, pointLights, searchlight, toggleDayEclipse }}
 */
export function createLighting(scene) {

    // ---Directional light : Sun (Day mode) ---
    // Positioned far to the upper-right to caset angles shadows across the station
    const sunLight = new THREE.DirectionalLight(0xfff4e0, 2.0);
    sunLight.position.set(200, 150, 100);
    scene.add(sunLight);

    // -- Directional light : Eclipse mode ---
    // Deep blue, low intensity - simulates the station passing behind a planet
    // Disabled by default, swapped in when player presses L
    const eclipseLight = new THREE.DirectionalLight(0x1a1aff, 0.15);
    eclipseLight.position.set(-200, -50, -100); // Opposite side to the sun
    eclipseLight.visible = false;
    scene.add(eclipseLight);

// --- Point lights : Docking bay beacons ---
    // Placed at the outer caps of four habitat modules (x=±28, y=30 and y=0)
    // Orange-white glow — suggests pressurised module lighting and docking beacons
    const pointLightPositions = [
        new THREE.Vector3( 28, 30, 0),
        new THREE.Vector3(-28, 30, 0),
        new THREE.Vector3( 28,  0, 0),
        new THREE.Vector3(-28,  0, 0),
    ];

    const pointLights = pointLightPositions.map((pos) => {
        // args: colour, intensity, distance (falloff radius)
        const p1 = new THREE.PointLight(0xff9944, 1.5, 60);
        p1.position.copy(pos);
        scene.add(p1);
        return p1;
    });

    // --- SpotLight : Docking guidance ---
    // Fixed spotlight aimed at the upper port docking module
    // Simulates the approach guidance light a spacecraft would follow in
    const dockingSpot = new THREE.SpotLight(0x00cfff, 3.0);
    dockingSpot.position.set(60, 50, 30);
    dockingSpot.angle = Math.PI / 10;  // Narrow cone
    dockingSpot.penumbra = 0.3;        // soft edge
    dockingSpot.distance = 120;
    // target defaults to scene origin - aim it at the upper port module
    dockingSpot.target.position.set(28, 30, 0);
    scene.add(dockingSpot);
    scene.add(dockingSpot.target); // target must be added to scene seperately

    // --- SpotLight : Rotating searchLight ---
    // Mounted at the top of the station spine (y=60), rotates every frame
    // SceneManager advances the angle and calls searchlight.position.set() each frame
    const searchlight = new THREE.SpotLight(0xffffff, 4.0);
    searchlight.position.set(0, 60, 0);
    searchlight.angle = Math.PI / 12;
    searchlight.penumbra = 0.2;
    searchlight.distance = 150;
    searchlight.target.position.set(0, 0, 0); // Points at station core by default
    scene.add(searchlight);
    scene.add(searchlight.target);

    // --Day / Eclipse toggle ---
    // Swaps sun and eclipse lights - called by SceneManager on L keypress
    const toggleDayEclipse = () => {
        sunLight.visible     = !sunLight.visible;
        eclipseLight.visible = !eclipseLight.visible;
    };

    return {
        sunLight,
        eclipseLight,
        pointLights,
        dockingSpot,
        searchlight,
        toggleDayEclipse,
    }
}