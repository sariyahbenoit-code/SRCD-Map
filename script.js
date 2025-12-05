// ----------------------------------------
// MAP INITIALIZATION (UNCHANGED SETTINGS)
// ----------------------------------------
mapboxgl.accessToken =
    "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/standard",
    config: {
        basemap: {
            theme: "monochrome"
        }
    },
    zoom: 18,
    center: [-122.514522, 37.967155 ],
    pitch: 60,
    antialias: true
});

// ----------------------------------------
// LOAD POINT GEOJSON FILE
// ----------------------------------------
const pointsURL = "points.geojson";

const THREE_JS = window.THREE;
const gltfLoader = new THREE_JS.GLTFLoader();

// ----------------------------------------
// STYLE LOAD EVENT (REQUIRED)
// ----------------------------------------
map.on("style.load", () => {
    console.log("MAP STYLE LOADED");

    add3DBuildings();
    loadPointsAndModels();
});

// ----------------------------------------
// ADD 3D BUILDINGS (UNCHANGED STYLE LOGIC)
// ----------------------------------------
function add3DBuildings() {
    const layers = map.getStyle().layers;
    const labelLayerId = layers.find(l => l.type === "symbol")?.id;

    map.addLayer(
        {
            id: "3d-buildings",
            type: "fill-extrusion",
            source: "composite",
            "source-layer": "building",
            filter: ["==", ["get", "extrude"], "true"],
            paint: {
                "fill-extrusion-color": "#aaaaaa",
                "fill-extrusion-height": ["get", "height"],
                "fill-extrusion-base": ["get", "min_height"],
                "fill-extrusion-opacity": 0.7
            }
        },
        labelLayerId
    );
}

// ----------------------------------------
// LOAD POINTS + DRAW CIRCLES + ADD GLB MODELS
// ----------------------------------------
async function loadPointsAndModels() {
    const response = await fetch(pointsURL);
    const geojson = await response.json();

    map.addSource("points", {
        type: "geojson",
        data: geojson
    });

    map.addLayer({
        id: "point-circles",
        type: "circle",
        source: "points",
        paint: {
            "circle-radius": 8,
            "circle-color": "#ff5500",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff"
        }
    });

    // Add GLB models for each point
    geojson.features.forEach((feature, index) => {
        const lngLat = feature.geometry.coordinates;
        addGLBModelAt(lngLat, index);
    });
}

// ----------------------------------------
// PLACE GLB MODEL AT GIVEN COORDINATE
// ----------------------------------------
function addGLBModelAt(lngLat, index) {
    const merc = mapboxgl.MercatorCoordinate.fromLngLat(lngLat, 0);

    const transform = {
        translateX: merc.x,
        translateY: merc.y,
        translateZ: merc.z,
        rotateX: Math.PI / 2,
        rotateY: 0,
        rotateZ: 0,
        scale: merc.meterInMercatorCoordinateUnits() * 1.0
    };

    const id = "glb-model-" + index;

    const customLayer = {
        id,
        type: "custom",
        renderingMode: "3d",

        onAdd: function (map, gl) {
            this.scene = new THREE_JS.Scene();
            this.camera = new THREE_JS.Camera();

            const light = new THREE_JS.DirectionalLight(0xffffff);
            light.position.set(0, 70, 100).normalize();
            this.scene.add(light);

            gltfLoader.load("model.glb", gltf => {
                this.scene.add(gltf.scene);
            });

            this.renderer = new THREE_JS.WebGLRenderer({
                canvas: map.getCanvas(),
                context: gl,
                antialias: true
            });

            this.renderer.autoClear = false;
        },

        render: function (gl, matrix) {
            const m = new THREE_JS.Matrix4().fromArray(matrix);

            const l = new THREE_JS.Matrix4()
                .makeTranslation(
                    transform.translateX,
                    transform.translateY,
                    transform.translateZ
                )
                .scale(
                    new THREE_JS.Vector3(
                        transform.scale,
                        -transform.scale,
                        transform.scale
                    )
                )
                .multiply(
                    new THREE_JS.Matrix4().makeRotationAxis(
                        new THREE_JS.Vector3(1, 0, 0),
                        transform.rotateX
                    )
                );

            this.camera.projectionMatrix = m.multiply(l);
            this.renderer.state.reset();
            this.renderer.render(this.scene, this.camera);
            map.triggerRepaint();
        }
    };

    map.addLayer(customLayer);
}

// ----------------------------------------
// BUTTON LOGIC (RESTORED EXACTLY AS BEFORE)
// ----------------------------------------
document.getElementById("zoomRegion").onclick = () => {
    map.flyTo({
        center: [-122.514522, 37.967155 ],
        zoom: 19,
        pitch: 60,
        bearing: 0
    });
};

document.getElementById("resetView").onclick = () => {
    map.flyTo({
        center: [-122.514522, 37.967155 ],
        zoom: 18,
        pitch: 60,
        bearing: 0
    });
};
