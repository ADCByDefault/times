import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";

// Initialize the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("canvas"),
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Orbit controls for camera interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;

// Directional light (sunlight)
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.castShadow = true;
directionalLight.shadow.bias = -0.003; // Shadow bias for softer shadows
directionalLight.shadow.mapSize.width = 2048; // High resolution shadows
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Dense grid
const gridHelper = new THREE.GridHelper(200, 400, 0x888888, 0x444444);
scene.add(gridHelper);

// Set up loaders
const loader = new GLTFLoader();
let earth, moon, sun;

// Constants
const moonDistanceFromEarth = 5;
const sunDistanceFromEarth = 20;
const earthScale = 1 / 500;
const moonScale = 1 / 1200;
const sunScale = 1 / 200;

// Load models
const loadModels = () => {
    return new Promise((resolve, reject) => {
        let loadedCount = 0;
        const models = {};

        const checkAllLoaded = () => {
            loadedCount++;
            if (loadedCount === 3) resolve(models);
        };

        loader.load(
            "./models/Earth.glb",
            (gltf) => {
                earth = gltf.scene;
                earth.scale.set(earthScale, earthScale, earthScale);
                models.earth = earth;
                checkAllLoaded();
            },
            undefined,
            reject
        );

        loader.load(
            "./models/Moon.glb",
            (gltf) => {
                moon = gltf.scene;
                moon.scale.set(moonScale, moonScale, moonScale);
                models.moon = moon;
                checkAllLoaded();
            },
            undefined,
            reject
        );

        loader.load(
            "./models/Sun.glb",
            (gltf) => {
                sun = gltf.scene;
                sun.scale.set(sunScale, sunScale, sunScale);
                models.sun = sun;
                checkAllLoaded();
            },
            undefined,
            reject
        );
    });
};

// Time management
let timePerFrame = 1; // in seconds
let currentDate = new Date();

function calculateGMST(date) {
    const now = new Date(date);
    const julianDate = now.getTime() / 86400000.0 + 2440587.5;
    const d = julianDate - 2451545.0;
    const gmst = 280.46061837 + 360.98564736629 * d;
    return gmst % 360;
}

function calculateSunPosition(date) {
    const daysSinceVernalEquinox =
        (new Date(date) - new Date(new Date(date).getFullYear(), 2, 20)) /
        86400000;
    const sunOrbitalAngle = daysSinceVernalEquinox * ((2 * Math.PI) / 365.25);
    const sunX = -sunDistanceFromEarth * Math.cos(sunOrbitalAngle);
    const sunZ = sunDistanceFromEarth * Math.sin(sunOrbitalAngle);

    // Inclination of the Earth's axis is now applied to the Sun's orbit
    const sunY = sunZ * Math.tan(THREE.MathUtils.degToRad(23.44));
    return new THREE.Vector3(sunX, sunY, sunZ);
}

function calculateMoonPositionAndRotation(date) {
    const moonInclination = THREE.MathUtils.degToRad(5.145);
    const moonOrbitalPeriod = 27.32; // in days

    const daysSinceNewMoon =
        (new Date(date) - new Date("2024-01-01")) / 86400000;
    const moonMeanAnomaly =
        ((2 * Math.PI) / moonOrbitalPeriod) * daysSinceNewMoon;
    const moonX = moonDistanceFromEarth * Math.cos(moonMeanAnomaly);
    const moonZ = moonDistanceFromEarth * Math.sin(moonMeanAnomaly);

    const moonPositionEcliptic = new THREE.Vector3(moonX, 0, moonZ);
    const moonRotationMatrix = new THREE.Matrix4().makeRotationX(
        moonInclination
    );
    moonPositionEcliptic.applyMatrix4(moonRotationMatrix);

    // Moon's synchronous rotation
    moon.rotation.y = moonMeanAnomaly;

    return moonPositionEcliptic;
}

function initializeScene() {
    scene.add(earth);
    scene.add(moon);
    scene.add(sun);

    camera.position.set(2, 1, 0);
    camera.lookAt(earth.position);

    directionalLight.position.copy(sun.position);
    directionalLight.target = earth;
    directionalLight.target.updateMatrixWorld();
}

// Display the simulated date on the screen
const dateDisplay = document.createElement("div");
dateDisplay.style.position = "absolute";
dateDisplay.style.top = "10px";
dateDisplay.style.left = "10px";
dateDisplay.style.color = "white";
dateDisplay.style.fontSize = "18px";
document.body.appendChild(dateDisplay);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    //sun position debug
    const points = [new THREE.Vector3(0, 0, 0), sun.position];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
    const line = new THREE.Line(geometry, material);
    scene.add(line);

    // currentDate.setSeconds(currentDate.getSeconds() + timePerFrame);

    // Update Earth rotation (corrected)
    const gmst = calculateGMST(currentDate);
    earth.rotation.y =
        THREE.MathUtils.degToRad(90) + THREE.MathUtils.degToRad(gmst);

    // Update Sun position
    const sunPosition = calculateSunPosition(currentDate);
    sun.position.copy(sunPosition);
    directionalLight.position.copy(sunPosition);

    // Update Moon position and rotation
    const moonPosition = calculateMoonPositionAndRotation(currentDate);
    moon.position.copy(moonPosition);

    // Update date display
    dateDisplay.textContent = `Simulated Date: ${currentDate.toUTCString()}`;

    // Update controls and render the scene
    controls.update();
    renderer.render(scene, camera);
}

loadModels()
    .then((models) => {
        earth = models.earth;
        moon = models.moon;
        sun = models.sun;

        initializeScene();
        animate();
    })
    .catch((error) => {
        console.error("Error loading models:", error);
    });

const gui = new GUI();
const params = {
    timePerFrame: 1, //time step per frame in seconds
};
gui.add(params, "timePerFrame", 1, 4000).onChange((value) => {
    timePerFrame = value;
});
