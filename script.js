import mapboxgl from "https://api.mapbox.com/mapbox-gl-js/v3.17.0/mapbox-gl.js";

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.159/build/three.module.js";

import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/loaders/GLTFLoader.js";

import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/loaders/DRACOLoader.js";

// map set up

mapboxgl.accessToken = 'pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA';

const targetCenter = [-122.514522, 37.967155];

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/standard',
    config: { basemap: { theme: 'monochrome' }},
    center: targetCenter,
    zoom: 17,
    pitch: 60,
    antialias: true
});

let renderer, scene, camera;



const loader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath(
  "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/libs/draco/"
);
loader.setDRACOLoader(draco);

const benchOrigin = [-122.512606, 37.967814];
const pondOrigin = [-122.5144361, 37.96595];
const closetOrigin = [-122.513856, 37.967939];

const modelAltitude = 0;
const modelRotate = [Math.PI / 2, 0, 0];

function makeTransform(origin) {
  const mc = mapboxgl.MercatorCoordinate.fromLngLat(origin, modelAltitude);
  return {
    translateX: mc.x,
    translateY: mc.y,
    translateZ: mc.z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    scale: mc.meterInMercatorCoordinateUnits(),
  };
}

const benchTransform = makeTransform(benchOrigin);
const pondTransform = makeTransform(pondOrigin);
const closetTransform = makeTransform(closetOrigin);



async function loadModel(url, scale = 200) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        gltf.scene.scale.set(scale, scale, scale);
        resolve(gltf.scene);
      },
      undefined,
      reject
    );
  });
}
let benchModel, pondModel, closetModel;



const customLayer = {
  id: "3d-model-layer",
  type: "custom",
  renderingMode: "3d",

  onAdd: async function (map, gl) {
    scene = new THREE.Scene();
    camera = new THREE.Camera();

    renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });
    
    renderer.autoClear = false;

    benchModel = await loadModel("assets/models/bench.glb");
    pondModel = await loadModel("assets/models/pond_pack.glb");
    closetModel = await loadModel("assets/models/closet.glb");

    scene.add(benchModel);
    scene.add(pondModel);
    scene.add(closetModel);
  },

render: (gl, matrix) => {
    if (!benchModel) return;

    renderer.resetState();

function renderModel(obj, t) {
      const rotX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        t.rotateX
      );
      const rotY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        t.rotateY
      );
      const rotZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        t.rotateZ
      );

      const translation = new THREE.Matrix4().makeTranslation(
        t.translateX,
        t.translateY,
        t.translateZ
      );
        const scale = new THREE.Matrix4().makeScale(t.scale, -t.scale, t.scale);


      const m = new THREE.Matrix4().fromArray(matrix);
      const l = new THREE.Matrix4()
        .multiply(rotX)
        .multiply(rotY)
        .multiply(rotZ)
        .multiply(scale)
        .multiply(translation);

      camera.projectionMatrix = m.multiply(l);

      renderer.render(scene, camera);
    }

    renderModel(benchModel, benchTransform);
    renderModel(pondModel, pondTransform);
    renderModel(closetModel, closetTransform);

    map.triggerRepaint();
  },
};


map.on("load", () => {
  map.addLayer(customLayer);
});

// Button: Zoom to SRCD region (zoom 12)
document.getElementById("zoomRegion").addEventListener("click", () => {
    map.flyTo({
        center: targetCenter,
        zoom: 12,
        speed: 0.6
    });
});

// Button: Reset view (zoom 16)
document.getElementById("resetView").addEventListener("click", () => {
    map.flyTo({
        center: targetCenter,
        zoom: 16,
        speed: 0.6
    });
});

// Checkboxes 
document.getElementById("togglePond").addEventListener("change", (e) => {
    // example:
    // map.setLayoutProperty("pond-layer", "visibility", e.target.checked ? "visible" : "none");
    console.log("togglePond:", e.target.checked);
});

document.getElementById("toggleBench").addEventListener("change", (e) => {
    console.log("toggle Bench:", e.target.checked);
});

document.getElementById("toggleCloset").addEventListener("change", (e) => {
    console.log("toggle Closet:", e.target.checked);
});

