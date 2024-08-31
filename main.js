import * as Utils from "./utils";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import SunCalc from "suncalc";

// Scene camera and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("canvas"),
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.enablePan = true;
controls.enableRotate = true;
controls.enableZoon = true;
camera.position.set(10, 3, 5);
controls.update();

// Global Illumination
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.castShadow = true;
directionalLight.shadow.bias = -0.003;
directionalLight.shadow.mapSize.width = 8192;
directionalLight.shadow.mapSize.height = 8192;
const ambientLight = new THREE.AmbientLight(0xffffff, 0.01);
scene.add(directionalLight, ambientLight);

// Grid for debug
const gridHelper = new THREE.GridHelper(200, 400, 0x888888, 0x444444);
scene.add(gridHelper);

// Meshes and user's position
const [earth, sun, moon, userPosition] = await Promise.all([
    Utils.loadModel("./models/Earth.glb", 1 / 500),
    Utils.loadModel("./models/Sun.glb", 1 / 500),
    Utils.loadModel("./models/Moon.glb", 1 / 1000),
    Utils.getCurrentPosition(),
]);
earth.rotateY(Utils.degToRad(-90));
scene.add(earth, moon, sun);

// Animation
let animationRequest = null;
animate();
function animate() {
    animationRequest = requestAnimationFrame(animate);
    const latitude = 0;
    const longitude = 0;
    // const date = new Date(2024, 3, 8, 20, 20);
    const date = new Date();

    let spos = SunCalc.getPosition(date, latitude, longitude);
    let mpos = SunCalc.getMoonPosition(date, latitude, longitude);

    let sunPosition = Utils.horizontalToCartesian(
        spos.azimuth,
        spos.altitude,
        800
    );
    let moonPosition = Utils.horizontalToCartesian(
        mpos.azimuth,
        mpos.altitude,
        20
    );
    console.log(spos)
    setSun(sunPosition);
    setMoon(moonPosition);

    controls.update();
    renderer.render(scene, camera);
}

/**
 *
 * @param {THREE.Vector3} position
 */
function setMoon(position) {
    moon.position.copy(position);
    moon.lookAt(0, 0, 0);
    moon.rotateY(Utils.degToRad(90));
}

/**
 *
 * @param {THREE.Vector3} position
 */
function setSun(position) {
    sun.position.copy(position);
    const lightPosition = position.multiplyScalar(0.5);
    directionalLight.position.copy(lightPosition);
}
