import * as Utils from "./utils";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import SunCalc from "suncalc";
import { TextGeometry } from "three/examples/jsm/Addons.js";

// Scene camera and renderer
/** @type {HTMLCanvasElement}*/
const canvas = document.getElementById("canvas");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

sizeCanvas();

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.04;
controls.enablePan = false;
// controls.enableZoom = false;
controls.enableRotate = true;
camera.position.set(3, 0, 2);
controls.update();

// Canvas on window change
window.addEventListener("resize", () => {
    sizeCanvas();
});

function sizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Global Illumination
const directionalLight = new THREE.DirectionalLight(0xffffff, 4);
directionalLight.castShadow = true;
directionalLight.shadow.bias = -0.003;
directionalLight.shadow.mapSize.width = 8192;
directionalLight.shadow.mapSize.height = 8192;
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(directionalLight, ambientLight);

// Grid for debug
// const gridHelper = new THREE.GridHelper(200, 400, 0x888888, 0x444444);
// scene.add(gridHelper);

// Meshes and user's position and setup
const [earth, sun, moon, customFont] = await Promise.all([
    Utils.loadModel("./assets/Earth.glb", 1 / 500),
    Utils.loadModel("./assets/Sun.glb", 1 / 500),
    Utils.loadModel("./assets/Moon.glb", 1 / 3000),
    Utils.loadFont("./assets/JetBrainsMono-MediumItalic.ttf"),
]);
const userPosition = Utils.getCurrentPosition();

const textMeshes = [
    new Utils.TextMesh("ciao", customFont, {}, { depthTest: false }),
    new Utils.TextMesh("mamma", customFont, {}, { depthTest: false }),
];
textMeshes.forEach((text) => {
    scene.add(text.mesh);
});

setUp();

// Animation
let animationRequest = null;
window.LOADERLIBLOADED(() => {
    animationRequest = animate();
    document.getElementById("canvas").classList.remove("d-none");
});
function animate() {
    handleSunMoonPosition();
    setText();
    // updates
    controls.update();
    renderer.render(scene, camera);
    animationRequest = requestAnimationFrame(animate);
}

function handleSunMoonPosition() {
    const date = new Date();
    let latitude = 0;
    let longitude = 0;
    // longitude = (360/24)*(date.getUTCHours()+date.getUTCMinutes()/60) - 180;
    const spos = SunCalc.getPosition(date, latitude, longitude);
    const mpos = SunCalc.getMoonPosition(date, latitude, longitude);
    spos.azimuth += Math.PI;
    mpos.azimuth += Math.PI;
    //rotated sun coordinates
    const rsc = Utils.horizontalToCartesian(spos.azimuth, spos.altitude, 800);
    const alignedSunCoordinates = new THREE.Vector3(rsc.y, rsc.x, -rsc.z);
    //rotated moon coordinates
    const rmc = Utils.horizontalToCartesian(mpos.azimuth, mpos.altitude, 50);
    const alignedMoonCoordinates = new THREE.Vector3(rmc.y, rmc.x, -rmc.z);

    setSun(alignedSunCoordinates);
    setMoon(alignedMoonCoordinates);
    return { sun: alignedSunCoordinates, moon: alignedMoonCoordinates };
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

function setText() {
    const date = new Date();
    const timeString = `${date.toString().split(" ")[4]}`;
    const size = textMeshes.reduce((prev, curr) => {
        prev.add(curr.boundingBox.max);
        return prev;
    }, new THREE.Vector3(0, 0, 0));
    const halfSize = size.clone().multiplyScalar(1 / 2);
    //
    textMeshes.forEach((text) => {
        if (timeString !== text.text) {
            text.changeTextTo(timeString);
        }
        const t = text.mesh.clone(size);
        t.lookAt(camera.position);
        text.mesh.quaternion.slerp(t.quaternion, 0.1);
    });
}

function setUp() {
    //positions
    earth.rotateY(Utils.degToRad(-90));
    scene.add(earth, moon, sun);
    let date = new Date();
    let lat = 35;
    let long = (360 / 24) * date.getUTCHours() - 180;
    camera.position.copy(Utils.geographicToCartesian(lat, long, 5));
    setText();
}
