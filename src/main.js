/**
 * main.js
 * -------
 * Entry point for the 3D Space Station application.
 * Retrieves the canvas from the DOM and passes it to SceneManager,
 * which handles all scene setup, animation, and event listeners.
 *
 * COS3712 — Computer Graphics | Assessment 2
 * Taariq Charles | 67818900
 * Repository: https://github.com/Taariq-06/space_station
 */

import { SceneManager } from "./core/sceneManager.js";

// Get the canvas element from the DOM
const canvas = document.querySelector("#c");

// Hand off to SceneManager — it takes it from here
new SceneManager(canvas);