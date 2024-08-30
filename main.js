import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import SunCalc from "suncalc";

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

// Helper function: Convert azimuth and altitude (elevation) to Cartesian coordinates
function azimuthAltitudeToCartesian(azimuth, altitude, distance = 1) {
    const x = distance * Math.cos(altitudeRad) * Math.sin(azimuthRad);
    const y = distance * Math.cos(altitudeRad) * Math.cos(azimuthRad);
    const z = distance * Math.sin(altitudeRad);

    return new THREE.Vector3(x, y, z);
}

// function degToRad(deg) {
//     return (deg * Math.PI) / 180;
// }
// function radToDeg(rad) {
//     return (rad * 180) / Math.PI;
// }

const lat = 36,
    long = -89;
console.log(SunCalc);
const date = new Date(2024, 3, 8, 19, 18);
console.log(date);
const pos = SunCalc.getPosition(date, lat, long);
const mpos = SunCalc.getMoonPosition(date, lat, long);
console.log(pos, mpos);
