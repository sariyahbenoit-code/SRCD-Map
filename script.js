
import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/loaders/DRACOLoader.js";

mapboxgl.accessToken =
  "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

// Center of your SRCD area
const targetCenter = [-122.514522, 37.967155];

// Your image points GeoJSON (now includes BeforeMedia where relevant)
const imagePoints = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "Landmark": "Building entrance",
        "PopupMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/building%20entrance.png"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.51403244782145, 37.96782576318992]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Landmark": "Marshland change over time",
        "PopupMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/change%20over%20time%20floating.png",
        "BeforeMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/floating%20houses%20before.png"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.51354133407277, 37.967894011876524]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Landmark": "Corner park day and night",
        "PopupMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/corner%20park%20day%20night.png",
        "BeforeMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/corner%20park%20before.png"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.51261014782297, 37.96772672087894]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Landmark": "Corner park overview",
        "PopupMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/corner%20park.png"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.5127367747097, 37.96788480707045]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Landmark": "Fisheye perspective of forebay",
        "PopupMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/fisheye%20perspective.png",
        "BeforeMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/forebay%20before.png"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.51460483446996, 37.96568378935048]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Landmark": "Floating housing overview",
        "PopupMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/floating%20housing.png",
        "BeforeMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/floating%20houses%20before.png"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.5143025251341, 37.96791673783633]
      }
    }
  ]
};

// Create the map with light style
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/light-v11",
  center: targetCenter,
  zoom: 17,
  pitch: 60,
  bearing: 0,
  antialias: true
});

map.on("error", (e) => console.error("MAPBOX ERROR:", e.error));

// THREE.js globals
let renderer, scene, camera;

// Loaders
const loader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath(
  "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/libs/draco/"
);
loader.setDRACOLoader(draco);

// Model origins matching your landmarks (lng, lat) - lifted above polygon
const benchOrigin = [-122.5127367747097, 37.96788480707045];   // Corner park overview
const closetOrigin = [-122.51403244782145, 37.96782576318992]; // Building entrance  
const pondOrigin   = [-122.51460483446996, 37.96568378935048]; // Fisheye perspective of forebay

const modelAltitude = 50;   // Lift models above polygon surface
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
    scale: mc.meterInMercatorCoordinateUnits()
  };
}

const benchTransform  = makeTransform(benchOrigin);
const pondTransform   = makeTransform(pondOrigin);
const closetTransform = makeTransform(closetOrigin);

// Load a GLB model
async function loadModel(url, scale = 1) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        gltf.scene.traverse((obj) => {
          if (obj.isMesh) {
            obj.castShadow = false;
            obj.receiveShadow = false;
          }
        });
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

// Custom 3D layer
const customLayer = {
  id: "3d-model-layer",
  type: "custom",
  renderingMode: "3d",

  onAdd: async function (map, gl) {
    scene = new THREE.Scene();
    camera = new THREE.Camera();

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(0, 100, 100);
    scene.add(dirLight);

    renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true
    });
    renderer.autoClear = false;

    try {
      benchModel = await loadModel(
        "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/models/bench.glb",
        1
      );
      scene.add(benchModel);
    } catch (e) {
      console.warn("Bench model not added.");
    }

    try {
      pondModel = await loadModel(
        "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/models/pond_pack.glb",
        1
      );
      scene.add(pondModel);
    } catch (e) {
      console.warn("Pond model not added.");
    }

    try {
      closetModel = await loadModel(
        "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/models/closet.glb",
        1
      );
      scene.add(closetModel);
    } catch (e) {
      console.warn("Closet model not added.");
    }
  },

  render: (gl, matrix) => {
    if (!renderer || (!pondModel && !closetModel && !benchModel)) return;

    camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);

    renderer.state.reset();
    renderer.autoClear = false;

    function applyTransform(obj, t, mult = 5) {
      if (!obj) return;

      obj.matrixAutoUpdate = false;

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

      const s = t.scale * mult;
      const scale = new THREE.Matrix4().makeScale(s, s, s);

      obj.matrix = new THREE.Matrix4()
        .multiply(rotX)
        .multiply(rotY)
        .multiply(rotZ)
        .multiply(scale)
        .multiply(translation);
    }

    applyTransform(benchModel,  benchTransform,  50);
    applyTransform(pondModel,   pondTransform,   50);
    applyTransform(closetModel, closetTransform, 50);
    
    if (benchModel)  benchModel.visible  = showBench;
    if (pondModel)   pondModel.visible   = showPond;
    if (closetModel) closetModel.visible = showCloset;

    renderer.render(scene, camera);
    map.triggerRepaint();
  }
};

// Load everything once basemap is ready
map.on("load", () => {
  // 1. Add your 3D models layer
  map.addLayer(customLayer);

  // OPTIONAL: Mapbox vector 3D buildings
  const layers = map.getStyle().layers;
  const labelLayerId = layers.find(
    (layer) => layer.type === "symbol" && layer.layout && layer.layout["text-field"]
  )?.id;

  if (labelLayerId) {
    map.addLayer(
      {
        id: "add-3d-buildings",
        source: "composite",
        "source-layer": "building",
        filter: ["==", "extrude", "true"],
        type: "fill-extrusion",
        minzoom: 15,
        paint: {
          "fill-extrusion-color": "#aaa",
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15, 0,
            15.05, ["get", "height"]
          ],
          "fill-extrusion-base": ["get", "min_height"],
          "fill-extrusion-opacity": 0.6
        }
      },
      labelLayerId
    );
  }

  // 2. Add your full 619data.geojson as a source
  map.addSource("srcd-geometry", {
    type: "geojson",
    data: "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/data/619data.geojson"
  });

  // 3. Big polygon (colors from your GeoJSON styling)
  map.addLayer({
    id: "srcd-polygon-fill",
    type: "fill",
    source: "srcd-geometry",
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: {
      "fill-color": "#256634",
      "fill-opacity": 0.4
    }
  });

  map.addLayer({
    id: "srcd-polygon-outline",
    type: "line",
    source: "srcd-geometry",
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: {
      "line-color": "#354739",
      "line-width": 2
    }
  });

  // 4. LineString (red)
  map.addLayer({
    id: "srcd-line",
    type: "line",
    source: "srcd-geometry",
    filter: ["==", ["geometry-type"], "LineString"],
    paint: {
      "line-color": "#E8240C",
      "line-width": 3
    }
  });

  // 5. Add your imagePoints as a source
  map.addSource("image-points", {
    type: "geojson",
    data: imagePoints
  });

  // 6. Add a circle layer for the points
  map.addLayer({
    id: "image-points-layer",
    type: "circle",
    source: "image-points",
    paint: {
      "circle-radius": 8,
      "circle-color": "#ff5500",
      "circle-stroke-width": 3,
      "circle-stroke-color": "#ffffff"
    }
  });

  // 7. Popups for image points (Before/After)
  map.on("click", "image-points-layer", (e) => {
    const feature = e.features && e.features[0];
    if (!feature) return;

    const coords    = feature.geometry.coordinates.slice();
    const title     = feature.properties.Landmark || "";
    const imgUrl    = feature.properties.PopupMedia || "";
    const beforeUrl = feature.properties.BeforeMedia || "";

    let html = `<div style="max-width:700px;">`;
    html += `<h3 style="margin:0 0 6px;font-family:'Roboto Mono',monospace;">${title}</h3>`;

    if (beforeUrl) {
      html += `
        <div style="margin-top:6px;">
          <div style="font-size:12px;margin-bottom:2px;">Before</div>
          <img src="${beforeUrl}" alt="${title} before" style="max-width:100%;height:auto;display:block;border-radius:4px;">
        </div>
      `;
    }

    if (imgUrl) {
      html += `
        <div style="margin-top:10px;">
          <div style="font-size:12px;margin-bottom:2px;">After</div>
          <img src="${imgUrl}" alt="${title}" style="max-width:100%;height:auto;display:block;border-radius:4px;">
        </div>
      `;
    }

    html += `</div>`;

    new mapboxgl.Popup({ closeOnClick: true })
      .setLngLat(coords)
      .setHTML(html)
      .addTo(map);
  });

  map.on("mouseenter", "image-points-layer", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "image-points-layer", () => {
    map.getCanvas().style.cursor = "";
  });

  // 8. Region zoom buttons
  const regionBounds = [
    [-122.5155, 37.9645], // SW
    [-122.5115, 37.9695]  // NE
  ];

  const zoomRegionBtn = document.getElementById("zoomRegion");
  const resetViewBtn  = document.getElementById("resetView");

  if (zoomRegionBtn) {
    zoomRegionBtn.addEventListener("click", () => {
      map.fitBounds(regionBounds, { padding: 40, pitch: 60, bearing: 0 });
    });
  }

  if (resetViewBtn) {
    resetViewBtn.addEventListener("click", () => {
      map.easeTo({
        center: targetCenter,
        zoom: 17,
        pitch: 60,
        bearing: 0
      });
    });
  }

  // 9. Checkbox toggles
  const pondCheckbox   = document.getElementById("togglePond");
  const benchCheckbox  = document.getElementById("toggleBench");
  const closetCheckbox = document.getElementById("toggleCloset");

  if (pondCheckbox) {
    pondCheckbox.checked = showPond;
    pondCheckbox.addEventListener("change", (e) => {
      showPond = e.target.checked;
      map.triggerRepaint();
    });
  }

  if (benchCheckbox) {
    benchCheckbox.checked = showBench;
    benchCheckbox.addEventListener("change", (e) => {
      showBench = e.target.checked;
      map.triggerRepaint();
    });
  }

  if (closetCheckbox) {
    closetCheckbox.checked = showCloset;
    closetCheckbox.addEventListener("change", (e) => {
      showCloset = e.target.checked;
      map.triggerRepaint();
    });
  }

  // 10. Raster image overlays (plans) at 25% opacity, 100% on hover

  // Corner park plan
  map.addSource("corner-park-plan", {
    type: "image",
    url: "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/plans/corner%20park%20plan.png",
    coordinates: [
      [-122.512964, 37.968772], // top-left (W, N)
      [-122.511369, 37.968772], // top-right (E, N)
      [-122.511369, 37.967322], // bottom-right (E, S)
      [-122.512964, 37.967322]  // bottom-left (W, S)
    ]
  });

  map.addLayer({
    id: "corner-park-plan-layer",
    type: "raster",
    source: "corner-park-plan",
    paint: {
      "raster-opacity": 0.25
    }
  });

  // Floating houses plan
  map.addSource("floating-houses-plan", {
    type: "image",
    url: "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/plans/floating%20house%20plan.png",
    coordinates: [
      [-122.514759, 37.968239], // top-left (W, N)
      [-122.513436, 37.968239], // top-right (E, N)
      [-122.513436, 37.967381], // bottom-right (E, S)
      [-122.514759, 37.967381]  // bottom-left (W, S)
    ]
  });

  map.addLayer({
    id: "floating-houses-plan-layer",
    type: "raster",
    source: "floating-houses-plan",
    paint: {
      "raster-opacity": 0.25
    }
  });

  // Forebay plan
  map.addSource("forebay-plan", {
    type: "image",
    url: "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/plans/forebay%20plan.png",
    coordinates: [
      [-122.515136, 37.966331], // top-left (W, N)
      [-122.513958, 37.966331], // top-right (E, N)
      [-122.513958, 37.965436], // bottom-right (E, S)
      [-122.515136, 37.965436]  // bottom-left (W, S)
    ]
  });

  map.addLayer({
    id: "forebay-plan-layer",
    type: "raster",
    source: "forebay-plan",
    paint: {
      "raster-opacity": 0.25
    }
  });

  // Hover interactions: fade to 100% opacity on mouseenter, back to 25% on mouseleave
  function bindRasterHover(layerId) {
    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
      map.setPaintProperty(layerId, "raster-opacity", 1.0);
    });
    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
      map.setPaintProperty(layerId, "raster-opacity", 0.25);
    });
  }

  bindRasterHover("corner-park-plan-layer");
  bindRasterHover("floating-houses-plan-layer");
  bindRasterHover("forebay-plan-layer");
});
