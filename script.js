import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/loaders/DRACOLoader.js";

mapboxgl.accessToken =
  "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

const targetCenter = [-122.514522, 37.967155];

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/standard",
  config: { basemap: { theme: "monochrome" } },
  center: targetCenter,
  zoom: 17,
  pitch: 60,
  antialias: true,
});

map.on("error", (e) => console.error("MAPBOX ERROR:", e.error));

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

async function loadModel(url, scale = 500) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        console.log("Loaded model:", url);
        gltf.scene.scale.set(scale, scale, scale);
        resolve(gltf.scene);
      },
      undefined,
      (err) => {
        console.error("Error loading model:", url, err);
        reject(err);
      }
    );
  });
}

let benchModel, pondModel, closetModel;
let showBench = true;
let showPond = true;
let showCloset = true;

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

    try {
      benchModel = await loadModel(
        "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/models/bench.glb"
      );
      scene.add(benchModel);
    } catch (e) {
      console.warn("Bench model not added.");
    }

    try {
      pondModel = await loadModel(
        "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/models/pond_pack.glb"
      );
      scene.add(pondModel);
    } catch (e) {
      console.warn("Pond model not added.");
    }

    try {
      closetModel = await loadModel(
        "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/models/closet.glb"
      );
      scene.add(closetModel);
    } catch (e) {
      console.warn("Closet model not added.");
    }
  },

  render: (gl, matrix) => {
    if (!pondModel && !closetModel && !benchModel) return;

    if (!window._3dLogged) {
      console.log("benchModel:", benchModel);
      console.log("pondModel:", pondModel);
      console.log("closetModel:", closetModel);
      window._3dLogged = true;
    }

    renderer.resetState();

    function renderModel(obj, t) {
      if (!obj) return;

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

    if (showBench)  renderModel(benchModel, benchTransform);
    if (showPond)   renderModel(pondModel, pondTransform);
    if (showCloset) renderModel(closetModel, closetTransform);

    map.triggerRepaint();
  },
};

map.on("load", () => {
  map.addLayer(customLayer);

  map.addSource("srcd-points", {
    type: "geojson",
    data: "data/619data.geojson",
  });

  map.addLayer({
    id: "srcd-points-layer",
    type: "circle",
    source: "srcd-points",
    paint: {
      "circle-radius": 6,
      "circle-color": "#e63946",
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1.5,
    },
  });

  map.on("mouseenter", "srcd-points-layer", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "srcd-points-layer", () => {
    map.getCanvas().style.cursor = "";
  });

  map.on("click", "srcd-points-layer", (e) => {
    if (!e.features || !e.features.length) return;
    const feature = e.features[0];
    const props = feature.properties || {};

    const landmark = props["Landmark"] || "Landmark";
    const address = props["Address"] || "";
    const proposal = props["Proposal"] || "";
    const proposalLink = props["Proposal Link"] || "";
    const existingLink = props["Existing Link"] || "";
    const precedent1 = props["Precedent1"] || "";
    const precedent2 = props["Precedent2"] || "";
    const extras1 = props["Extras1"] || "";
    const extras2 = props["Extras 2"] || "";
    const popupMedia = props["PopupMedia"] || "";

    const coordinates = feature.geometry.coordinates.slice();

    let html = `<strong>${landmark}</strong>`;
    if (address) html += `<br>${address}`;
    if (proposal) html += `<br><br><strong>Proposal:</strong> ${proposal}`;

    const links = [];
    if (proposalLink)
      links.push(
        `<a href="${proposalLink}" target="_blank">Proposal image</a>`
      );
    if (existingLink)
      links.push(
        `<a href="${existingLink}" target="_blank">Existing condition</a>`
      );
    if (precedent1)
      links.push(
        `<a href="${precedent1}" target="_blank">Precedent 1</a>`
      );
    if (precedent2)
      links.push(
        `<a href="${precedent2}" target="_blank">Precedent 2</a>`
      );
    if (extras1)
      links.push(`<a href="${extras1}" target="_blank">Extra 1</a>`);
    if (extras2)
      links.push(`<a href="${extras2}" target="_blank">Extra 2</a>`);

    if (links.length) {
      html += "<br><br><strong>Links:</strong><br>" + links.join("<br>");
    }

    if (popupMedia) {
      const lower = popupMedia.toLowerCase();
      const isImage =
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png") ||
        lower.endsWith(".gif") ||
        lower.endsWith(".webp");

      if (isImage) {
        html +=
          '<br><br>' +
          '<a href="' + popupMedia + '" target="_blank" style="display:inline-block; width: 100%;">' +
            '<img src="' + popupMedia + '" alt="Popup media" ' +
            'style="display:block; width: 100%; height: auto; min-width: 600px; max-width: 100%;">' +
          '</a>';
      } else {
        html +=
          '<br><br><a href="' + popupMedia +
          '" target="_blank"><strong>Open attached media</strong></a>';
      }
    }

    new mapboxgl.Popup({
      offset: [0, -150],
      anchor: "bottom",
    })
      .setLngLat(coordinates)
      .setHTML(html)
      .addTo(map);
  });
});

document.getElementById("zoomRegion").addEventListener("click", () => {
  map.flyTo({
    center: targetCenter,
    zoom: 14,
    speed: 0.6,
  });
});

document.getElementById("resetView").addEventListener("click", () => {
  map.flyTo({
    center: targetCenter,
    zoom: 16,
    speed: 0.6,
  });
});

document.getElementById("togglePond").addEventListener("change", (e) => {
  showPond = e.target.checked;
  console.log("togglePond:", e.target.checked);
  map.triggerRepaint();
});

document.getElementById("toggleBench").addEventListener("change", (e) => {
  showBench = e.target.checked;
  console.log("toggle Bench:", e.target.checked);
  map.triggerRepaint();
});

document.getElementById("toggleCloset").addEventListener("change", (e) => {
  showCloset = e.target.checked;
  console.log("toggle Closet:", e.target.checked);
  map.triggerRepaint();
});
