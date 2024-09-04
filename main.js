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
const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
directionalLight.castShadow = true;
directionalLight.shadow.bias = -0.003;
directionalLight.shadow.mapSize.width = 8192;
directionalLight.shadow.mapSize.height = 8192;
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(directionalLight, ambientLight);

// Grid for debug
const gridHelper = new THREE.GridHelper(200, 400, 0x888888, 0x444444);
scene.add(gridHelper);

// Meshes and user's position
const [earth, sun, moon, userPosition] = await Promise.all([
    Utils.loadModel("./models/Earth.glb", 1 / 500),
    Utils.loadModel("./models/Sun.glb", 1 / 500),
    Utils.loadModel("./models/Moon.glb", 1 / 10000),
    Utils.getCurrentPosition(),
]);
earth.rotateY(Utils.degToRad(-90));
scene.add(earth, moon, sun);
document.getElementById("canvas").style.display = "block";

const lat = userPosition.latitude;
const long = userPosition.longitude;
const geometry = new THREE.SphereGeometry(0.1, 64, 64);
const material = new THREE.MeshBasicMaterial();
const sphere = new THREE.Mesh(geometry, material);
const ps = Utils.geographicToCartesian(lat, long);
sphere.position.copy(ps);
scene.add(sphere);

// Animation
let animationRequest = null;
const date = new Date();
const latitude = 0;
const longitude = 0;
window.LOADERLIBLOADED(() => {
    animate();
});

function animate() {
    const spos = SunCalc.getPosition(date, latitude, longitude);
    const mpos = SunCalc.getMoonPosition(date, latitude, longitude);
    spos.azimuth += Utils.degToRad(180);
    mpos.azimuth += Utils.degToRad(180);
    date.setSeconds(date.getSeconds() + 20);
    //rotated sun coordinates
    const rsc = Utils.horizontalToCartesian(spos.azimuth, spos.altitude, 800);
    const alignedSunCoordinates = new THREE.Vector3(rsc.y, rsc.x, -rsc.z);
    //rotated moon coordinates
    const rmc = Utils.horizontalToCartesian(mpos.azimuth, mpos.altitude, 50);
    const alignedMoonCoordinates = new THREE.Vector3(rmc.y, rmc.x, -rmc.z);
    setSun(alignedSunCoordinates);
    setMoon(alignedMoonCoordinates);

    //
    controls.update();
    renderer.render(scene, camera);
    animationRequest = requestAnimationFrame(animate);
}

/**
 *
 * @param {THREE.Vector3} position
 */
function setMoon(position) {
    moon.position.copy(position);
    // moon.position.set(1, 0, 0);
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
