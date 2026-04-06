/**
 * BeaconShader.js
 * ---------------
 * Custom GLSL shader for the station beacon tips.
 * Produces a pulsing energy glow that oscillates between
 * bright cyan and deep blue using a sine wave driven by time.
 *
 * Uniforms:
 *   uTime — elapsed time in seconds, updated every frame
 *           by SceneManager via beaconMaterial.uniforms.uTime.value
 */

export const BeaconShader = {

    // uTime is the only uniform — drives the sine wave pulse
    uniforms: {
        uTime: { value: 0.0 },
    },

    // Vertex shader — passes UV coordinates to the fragment shader
    // gl_Position is the required output — final clip-space position
    vertexShader: /* glsl */`
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    // Fragment shader — computes the pulsing colour per pixel
    fragmentShader: /* glsl */`
        uniform float uTime;
        varying vec2 vUv;

        void main() {
            // sin() oscillates -1 to 1 — remap to 0.0 -> 1.0
            float pulse = sin(uTime * 3.0) * 0.5 + 0.5;

            // Bright cyan at peak, deep blue at minimum
            vec3 brightCyan = vec3(0.0, 0.95, 1.0);
            vec3 deepBlue   = vec3(0.0, 0.1,  0.4);

            // mix() linearly interpolates between the two colours
            vec3 color = mix(deepBlue, brightCyan, pulse);

            // gl_FragColor is the required output — final RGBA pixel colour
            gl_FragColor = vec4(color, 1.0);
        }
    `,
};