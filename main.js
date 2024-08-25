import * as Utils from "./utils.js";
import * as THREE from "three";
import SunCalc from "suncalc";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

//setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0,0,20);
const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("canvas"),
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
// controls.enablePan = false;
// controls.enableZoom = false;

//meshes
const sun = new Utils.Sun(scene, {
    position: new THREE.Vector3(800, 0, 0),
    scale: new THREE.Vector3(1 / 100, 1 / 100, 1 / 100),
    onLoad: () => {
        console.log("sun loaded");
    },
});
const earth = new Utils.Earth(scene, {
    position: new THREE.Vector3(0, 0, 0),
    scale: new THREE.Vector3(1 / 300, 1 / 300, 1 / 300),
    onLoad: () => {
        console.log("earth loaded");
    },
});
const moon = new Utils.Moon(scene, {
    position: new THREE.Vector3(-5, 0, 0),
    scale: new THREE.Vector3(1 / 800, 1 / 800, 1 / 800),
    onLoad: () => {
        console.log("moon loaded");
    },
});

//lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 8);
directionalLight.position.copy(sun.position);
scene.add(directionalLight);
// const pointLight = new THREE.PointLight(0xffffff,3000000);
// pointLight.position.set(700,0,0);
// pointLight.castShadow = true;
// const helper = new THREE.PointLightHelper(pointLight);
// scene.add(pointLight, helper);

let animationRequest = null;
function animate() {
    animationRequest = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", (event) => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
