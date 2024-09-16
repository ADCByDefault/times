import { defineConfig } from "vite";

export default defineConfig({
    build: {
        target: "es2022",
    },
    base: "/times/",
    resolve: {
        alias: {
            three: "./node_modules/three/three.module.js",
            suncalc: "./node_modules/suncalc.js",
        },
    },
});
