import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Font, TTFLoader } from "three/examples/jsm/Addons.js";
import { FontLoader } from "three/examples/jsm/Addons.js";
import { TextGeometry } from "three/examples/jsm/Addons.js";

export const Position = {
    latitude: null,
    longitude: null,
    latitudeRad: null,
    longitudeRad: null,
    navigatorPosition: null,
    ipapiData: null,
    error: true,
};
export async function getCurrentPosition() {
    const ret = {
        ...Position,
    };
    if (navigator.geolocation) {
        await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    ret.navigatorPosition = position;
                    resolve();
                },
                (e) => {
                    reject();
                }
            );
        });
    }
    const res = await getCurrentPositionByAPI();
    if (res.error && !ret.navigatorPosition) {
        ret.error = "failed to get data from navigator or ipapi";
        return ret;
    }
    const data = res.data;
    ret.error = false;
    ret.ipapiData = data;
    ret.latitude = ret.navigatorPosition
        ? ret.navigatorPosition.coords.latitude
        : data.latitude;
    ret.longitude = ret.navigatorPosition
        ? ret.navigatorPosition.coords.longitude
        : data.longitude;
    ret.latitudeRad = degToRad(ret.latitude);
    ret.longitudeRad = degToRad(ret.longitude);
    return ret;
}
export async function getCurrentPositionByAPI() {
    const ret = {
        error: true,
        data: null,
        latitude: null,
        longitude: null,
        latitudeRad: null,
        longitudeRad: null,
    };
    try {
        const res = await fetch("https://ipapi.co/json/").catch((error) => {
            ret.error = error;
            return ret;
        });
        const data = await res.json();
        ret.error = false;
        ret.data = data;
        ret.latitude = data.latitude;
        ret.longitude = data.longitude;
        ret.latitudeRad = degToRad(ret.latitude);
        ret.longitudeRad = degToRad(ret.longitude);
    } catch (error) {
        ret.error = error;
    }
    return ret;
}

export function degToRad(deg) {
    return (deg * Math.PI) / 180;
}
export function radToDeg(rad) {
    return (rad * 180) / Math.PI;
}

/**
 *
 * @param {string} path
 * @param {number} scale
 * @returns {Promise<THREE.Object3D>}
 */
export async function loadModel(path, scale = 1) {
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
        loader.load(
            path,
            (data) => {
                data.scene.traverse((node) => {
                    node.receiveShadow = true;
                    node.castShadow = true;
                });
                data.scene.scale.set(scale, scale, scale);
                resolve(data.scene);
            },
            (progress) => {},
            (error) => {
                reject(error);
            }
        );
    });
}
/**
 *
 * @param {String} path
 * @returns {Font}
 */
export async function loadFont(path) {
    const ttfLoader = new TTFLoader();
    const fontLoader = new FontLoader();
    const font = await new Promise((resolve, reject) => {
        ttfLoader.load(
            path,
            (json) => {
                resolve(fontLoader.parse(json));
            },
            (progress) => {},
            (error) => {
                reject(error);
            }
        );
    });
    return font;
}

/**
 *
 * @param {number} azimuth
 * @param {number} altitude
 * @param {number} distance
 * @returns {THREE.Vector3}
 * since amizuth and altitude dipends on latitude and longitude
 * the vector must be rotated and aligned the plane
 * in order to get the correct result
 */
export function horizontalToCartesian(azimuth, altitude, distance = 1) {
    const x = distance * Math.cos(altitude) * Math.cos(azimuth);
    const y = distance * Math.sin(altitude);
    const z = distance * Math.cos(altitude) * Math.sin(azimuth);
    return new THREE.Vector3(x, y, z);
}
/**
 * latitude = 0, longitude = 0, distance = 1 corrisponds to xyz {1, 0, 0}
 * 43.77315840789258, 11.255955552360946, d = 1 corrisponds to {x: 0.708195104212102, y: 0.6918049719154453, z: -0.14094529152504512}
 * the z is negated
 * @param {number} latitude
 * @param {number} longitude
 * @param {number} distance
 * @returns {THREE.Vector3}
 */
export function geographicToCartesian(latitude, longitude, distance = 1) {
    latitude = degToRad(latitude);
    longitude = degToRad(longitude);
    const x = distance * Math.cos(latitude) * Math.cos(longitude);
    const y = distance * Math.sin(latitude);
    const z = -distance * Math.cos(latitude) * Math.sin(longitude);
    return new THREE.Vector3(x, y, z);
}

export class TextMesh {
    /**
     *
     * @param {string} text
     * @param {Font} font
     * @param {import("three/examples/jsm/Addons.js").TextGeometryParameters} geometryOptions
     * @param {THREE.Material} material
     */
    constructor(text, font, geometryOptions = {}, material = {}) {
        /** @type {string} */
        this.text = text;
        /** @type {Font} */
        this.font = font;
        /** @type {import("three/examples/jsm/Addons.js").TextGeometryParameters} */
        this.geometryOptions = geometryOptions;
        /** @type {THREE.Material} */
        this.material = material;
        /** @type {THREE.Mesh<TextGeometry, THREE.MeshStandardMaterial, THREE.Object3DEventMap>} */
        this.mesh = this.makeTextMesh(font, text, geometryOptions, material);
        this.mesh.geometry.computeBoundingBox();
        /** @type {THREE.Box3} */
        this.boundingBox = this.mesh.geometry.boundingBox;
        this.centerMesh();
    }

    /**
     *
     * @param {Font} font
     * @param {string} string
     * @param {import("three/examples/jsm/Addons.js").TextGeometryParameters} geometryOptions
     * @param {THREE.Material} material
     * @returns {THREE.Mesh<TextGeometry, THREE.MeshStandardMaterial, THREE.Object3DEventMap>}
     */
    makeTextMesh(font, string, geometryOptions, material) {
        let geometry = new TextGeometry(string, {
            font: font,
            depth: geometryOptions.depth || 0.04,
            size:
                geometryOptions.size ||
                window.innerWidth /
                    (window.innerHeight + window.innerWidth) /
                    2,
            ...geometryOptions,
        });
        const textMesh = new THREE.Mesh(geometry, material);
        return textMesh;
    }

    /**
     *
     * @param {string} string
     */
    changeMeshTo(string) {
        this.text = string;
        let font = this.font;
        let geometryOptions = this.geometryOptions;
        let geometry = new TextGeometry(string, {
            depth: geometryOptions.depth || 0.04,
            size:
                geometryOptions.size ||
                window.innerWidth /
                    (window.innerHeight + window.innerWidth) /
                    2,
            font: font,
            ...geometryOptions,
        });
        this.mesh.geometry.dispose();
        this.mesh.geometry = geometry;
        geometry.computeBoundingBox();
        this.boundingBox = geometry.boundingBox;
        this.centerMesh();
    }

    centerMesh() {
        const max = this.boundingBox.max;
        this.mesh.geometry.translate(-max.x / 2, -max.y / 2, -max.z / 2);
    }

    /** @param {string} string*/
    updateText(string) {
        if (this.text !== string) {
            this.changeMeshTo(string);
        }
    }
}

/**
 *
 * @param {THREE.Object3D} object
 * @param {THREE.Vector3} position
 * @param {number} slerpValue
 * @returns {THREE.Object3D} clone of the object
 */
export function lookAt(object, position, slerpValue = 1) {
    const t = object.clone();
    t.lookAt(position);
    object.quaternion.slerp(t.quaternion, slerpValue);
    return t;
}

/**
 *
 * @param {THREE.Object3D} object
 * @param {THREE.Vector3} position
 * @param {number} lerpValue
 */
export function moveTo(object, position, lerpValue = 1) {
    if (object.position.equals(position)) {
        return;
    }
    object.position.lerp(position, lerpValue);
}

/**
 *
 * @param {THREE.Object3D} object
 * @returns {THREE.Vector3}
 */
export function getNormalWorldDirection(object) {
    const dir = object.getWorldDirection(new THREE.Vector3()).normalize();
    return dir;
}

/**
 *
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}
/**
 *
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function getFlooredRandom(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}
