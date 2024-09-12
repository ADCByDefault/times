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
camera.position.set(5, 50, 0);
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.04;
controls.enablePan = false;
// controls.enableZoom = false;
controls.enableRotate = true;

// Canvas on window change
sizeCanvas();
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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.01);
scene.add(directionalLight, ambientLight);

// Meshes
const [earth, sun, moon, customFont] = await Promise.all([
    Utils.loadModel("./assets/Earth.glb", 1 / 500),
    Utils.loadModel("./assets/Sun.glb", 1 / 500),
    Utils.loadModel("./assets/Moon.glb", 1 / 3000),
    Utils.loadFont("./assets/FreeMono.ttf"),
]);

//Texts
const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.2, 0.07),
    new THREE.MeshStandardMaterial({ color: 0xef77ef, depthTest: false })
);
function fontSize() {
    return window.innerWidth / (window.innerHeight + window.innerWidth) / 2;
}
const dateMeshOptions = {
    fontMultiplier: 0.5,
};
const timeMeshOptions = {
    fontMultiplier: 1,
};
const dateMesh = new Utils.TextMesh(
    "",
    customFont,
    { size: fontSize() * dateMeshOptions.fontMultiplier },
    { depthTest: false }
);
const timeMesh = new Utils.TextMesh(
    "",
    customFont,
    { size: fontSize() * timeMeshOptions.fontMultiplier },
    { depthTest: false }
);
const textMeshes = [dateMesh, timeMesh];
textMeshes.forEach((text) => {
    scene.add(text.mesh);
});

//variables and setup
let userPosition = Utils.Position;
Utils.getCurrentPositionByAPI().then((ret) => {
    if (ret.error && userPosition.error) return;
    userPosition = { ...userPosition, ...ret };
});
Utils.getCurrentPosition().then((pos) => {
    if (pos.error) return;
    let p = Utils.geographicToCartesian(pos.latitude, pos.longitude, 4);
    cameraShouldBeAt.copy(p);
    userPosition = {
        ...pos,
    };
});
let isUserInteracting = false;
const cameraShouldBeAt = new THREE.Vector3(5, 0, 0);
setUp();

// Animation
let animationRequest = null;
window.LOADERLIBLOADED(() => {
    animationRequest = animate();
    document.getElementById("canvas").classList.remove("d-none");
});
function animate() {
    handleSunMoonPosition();
    handleText();
    // updates
    if (!isUserInteracting) {
        Utils.moveTo(camera, cameraShouldBeAt, 0.02);
    }
    controls.update();
    renderer.render(scene, camera);
    animationRequest = requestAnimationFrame(animate);
}

function handleSunMoonPosition() {
    const date = new Date();
    const latitude = 0;
    const longitude = 0;
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
}
/**
 *
 * @param {THREE.Vector3} position
 */
function setMoon(position) {
    Utils.moveTo(moon, position);
    moon.lookAt(0, 0, 0);
    moon.rotateY(Utils.degToRad(90));
}
/**
 *
 * @param {THREE.Vector3} position
 */
function setSun(position) {
    Utils.moveTo(sun, position);
    const lightPosition = position.multiplyScalar(0.5);
    directionalLight.position.copy(lightPosition);
}

function handleText() {
    //scalar calculations
    const ygap = 0.04;
    let ySize = textMeshes.reduce(
        (prev, curr) => prev + curr.boundingBox.max.y + ygap,
        0
    );

    // animation
    const t = Utils.lookAt(box, camera.position, 0.1);
    t.rotateX(-Math.PI / 2);
    const dir = Utils.getNormalWorldDirection(t);
    textMeshes.forEach((text) => {
        text.mesh.quaternion.copy(box.quaternion);

        //positioning
        ySize = ySize - text.boundingBox.max.y - ygap;
        text.mesh.position.copy(dir.clone().multiplyScalar(ySize));
        ySize = ySize - text.boundingBox.max.y - ygap;
    });

    updateTextMeshes();
}

function updateTextMeshes() {
    const split = new Date().toString().split(" ");
    const timeString = `${split[4]}`;
    const dateString = `${split[0]} ${split[2]} ${split[1]} ${split[3]}`;

    timeMesh.updateText(timeString);
    dateMesh.updateText(dateString);
}

function setUp() {
    //positions
    earth.rotateY(Utils.degToRad(-90));
    scene.add(earth, moon, sun);
    let date = new Date();
    let lat = 35;
    let long = (360 / 24) * date.getUTCHours() - 180;
    cameraShouldBeAt.copy(Utils.geographicToCartesian(lat, long, 5));
}

let InteractionTimer = null;
const InteractionTimeoutTime = 10000;
controls.addEventListener("start", () => {
    clearTimeout(InteractionTimer);
    isUserInteracting = true;
});
controls.addEventListener("end", () => {
    InteractionTimer = setTimeout(() => {
        isUserInteracting = false;
    }, InteractionTimeoutTime);
});

window.addEventListener("resize", () => {
    dateMesh.geometryOptions.size = fontSize() * dateMeshOptions.fontMultiplier;
    timeMesh.geometryOptions.size = fontSize() * timeMeshOptions.fontMultiplier;
    timeMesh.changeMeshTo(timeMesh.text);
    dateMesh.changeMeshTo(dateMesh.text);
});
