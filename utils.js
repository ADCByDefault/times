import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

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
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok && !ret.navigatorPosition) {
        ret.error = "failed to get data from navigator or ipapi";
        return ret;
    }
    const data = await res.json();
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
 * @param {number} azimuth
 * @param {number} altitude
 * @param {number} distance
 * @returns {THREE.Vector3}
 */
export function horizontalToCartesian(azimuth, altitude, distance = 1) {
    const x = distance * Math.cos(altitude) * Math.cos(azimuth);
    const y = distance * Math.sin(altitude);
    const z = distance * Math.cos(altitude) * Math.sin(azimuth);
    return new THREE.Vector3(x, y, z);
}

/**
 * long = 0 , lat = 0, distance = 1 corrisponds to xyz (1, 0, 0)
 * @param {number} latitude
 * @param {number} longitude
 * @param {number} distance
 * @returns {THREE.Vector3}
 */
export function geographicToCartesian(latitude, longitude, distance = 1) {
    latitude = degToRad(latitude);
    longitude = degToRad(latitude);
    const x = distance * Math.cos(latitude) * Math.cos(longitude);
    const y = distance * Math.sin(latitude);
    const z = distance * Math.cos(latitude) * Math.sin(longitude);
    return new THREE.Vector3(x, y, z);
}
