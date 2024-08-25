import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import SunCalc from "suncalc";
import { Wireframe } from "three/examples/jsm/Addons.js";

export async function getCurrentPosition() {
    const ret = {
        latitude: null,
        longitude: null,
        navigatorPosition: null,
        ipapiData: null,
        error: true,
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
    ret.ipapiData = data;
    ret.latitude = ret.navigatorPosition
        ? ret.navigatorPosition.coords.latitude
        : data.latitude;
    ret.longitude = ret.navigatorPosition
        ? ret.navigatorPosition.coords.longitude
        : data.longitude;
    return ret;
}

export class Body {
    /**
     *
     * @param {THREE.Scene} scene
     * @param {*} options
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        this.name = options.name || "Body";
        this.position = options.position || new THREE.Vector3(0, 0, 0);
        this.scale = options.scale || new THREE.Vector3(1, 1, 1);
        this.rotationSpeed = options.rotationSpeed || 0;
        this.orbitRadius = options.orbitRadius || 0;
        this.orbitSpeed = options.orbitSpeed || 0;
        this.orbitCenter = options.orbitCenter || new THREE.Vector3(0, 0, 0);
        this.customMesh = options.customMesh || null;
        this.isloaded = false;
        /**
         * @type {THREE.Mesh}
         */
        this.object3D = null;
        /**
         * @type {THREE.Mesh}
         */
        this.helperSphere = null;
        this.helperScaleMultiplier = options.helperScaleMultiplier || 1;
        this.createBody(options.onLoad || (() => {}));
    }

    createHelper() {
        const geometry = new THREE.SphereGeometry(5, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            wireframe: true,
        });
        // const material = new THREE.MeshStandardMaterial({
        //     side: THREE.DoubleSide,
        // });
        this.helperSphere = new THREE.Mesh(geometry, material);
        this.helperSphere?.position.copy(this.position);
        this.helperSphere?.scale.copy(
            new THREE.Vector3(
                this.scale.x * this.helperScaleMultiplier,
                this.scale.y * this.helperScaleMultiplier,
                this.scale.z * this.helperScaleMultiplier
            )
        );
        this.helperSphere.material.side = THREE.DoubleSide;
        this.helperSphere.receiveShadow = true;
        this.helperSphere.castShadow = true;
        // this.scene.add(this.helperSphere);
    }

    createBody(onLoad) {
        this.createHelper();
        if (this.customMesh) {
            const loader = new GLTFLoader();
            loader.load(this.customMesh, (gltf) => {
                this.object3D = gltf.scene;
                this.setScale(this.scale);
                this.setPosition(this.position);
                this.scene.add(this.object3D);
                this.object3D.receiveShadow = true;
                this.object3D.castShadow = true;
                this.isloaded = true;
                // console.log(this.object3D);
                onLoad();
            });
        } else {
            const geometry = new THREE.SphereGeometry(5, 64, 64);
            const material = new THREE.MeshStandardMaterial(0x00ff00);
            this.object3D = new THREE.Mesh(geometry, material);
            this.setScale(this.scale);
            this.setPosition(this.position);
            this.scene.add(this.object3D);
            this.isloaded = true;
        }
    }

    setScale(vector3) {
        this.scale = vector3;
        this.object3D?.scale.copy(vector3);
        this.helperSphere?.scale.copy(
            new THREE.Vector3(
                vector3.x * this.helperScaleMultiplier,
                vector3.y * this.helperScaleMultiplier,
                vector3.z * this.helperScaleMultiplier
            )
        );
    }

    setPosition(vector3) {
        this.position = vector3;
        this.object3D?.position.copy(vector3);
        this.helperSphere?.position.copy(vector3);
    }

    update(deltaTime) {
        if (this.object3D) {
            this.object3D.rotation.y += this.rotationSpeed * deltaTime;
        }
        if (this.orbitRadius > 0 && this.orbitSpeed != 0) {
            const angle = this.orbitSpeed * deltaTime;
            this.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            this.object3D.position.copy(this.orbitCenter).add(this.position);
        }
        this.helperSphere.position.copy(this.object3D.position);
    }
}

export class Sun extends Body {
    constructor(scene, options = {}) {
        super(scene, {
            name: "Sun",
            customMesh: "./models/Sun.glb",
            helperScaleMultiplier: 100,
            scale: new THREE.Vector3(1 / 100, 1 / 100, 1 / 100),
            ...options,
        });
    }
}

export class Earth extends Body {
    constructor(scene, options = {}) {
        super(scene, {
            name: "Earth",
            customMesh: "./models/Earth.glb",
            helperScaleMultiplier: 100,
            scale: new THREE.Vector3(1 / 100, 1 / 100, 1 / 100),
            ...options,
        });
    }
}

export class Moon extends Body {
    constructor(scene, options = {}) {
        super(scene, {
            name: "Moon",
            customMesh: "./models/Moon.glb",
            helperScaleMultiplier: 100,
            scale: new THREE.Vector3(1 / 100, 1 / 100, 1 / 100),
            ...options,
        });
    }
}
