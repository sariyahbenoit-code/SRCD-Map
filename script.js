// ------------------------------
// VERSION 12_9 — FINAL FIXED JS
// ------------------------------

mapboxgl.accessToken =
  "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

// ------- MAP SETUP (same as 12_8) -------
const SRCD_CENTER = [-122.513922, 37.966597];

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/standard",
    config: { basemap: { theme: "monochrome" } },

    center: SRCD_CENTER,
    zoom: 17.5,
    pitch: 60,
    antialias: true
});

// ======== LOAD GEOJSON POINTS (FROM 12_8) =========
fetch("data/619data.geojson")
    .then(r => r.json())
    .then(geojson => {
        map.on("load", () => {

            // 3D BUILDINGS RESTORED
            add3DBuildings();

            // --- POINT SOURCE ---
            map.addSource("srcd-points", {
                type: "geojson",
                data: geojson
            });

            // POINTS ABOVE LABELS (as in 12_8)
            map.addLayer({
                id: "srcd-points-layer",
                type: "circle",
                source: "srcd-points",
                paint: {
                    "circle-radius": 8,
                    "circle-color": "#ff5500",
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#ffffff"
                }
            }, "road-label");

            // --- CLICK POPUP RESTORED ---
            map.on("click", "srcd-points-layer", (e) => {
                const props = e.features[0].properties;

                const html = `
                    <strong>${props.Landmark}</strong><br>
                    ${props.Address || ""}<br><br>
                    ${props.Proposal || ""}
                `;

                new mapboxgl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(html)
                    .addTo(map);
            });

            // Load .glb models after points
            add3DModels();
        });
    });


// =============== RESTORE 3D BUILDINGS ===================
function add3DBuildings() {

    const layers = map.getStyle().layers;
    let labelLayerId;

    for (const layer of layers) {
        if (layer.type === "symbol" && layer.layout["text-field"]) {
            labelLayerId = layer.id;
            break;
        }
    }

    map.addLayer(
        {
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 15,
            paint: {
                "fill-extrusion-color": "#aaa",
                "fill-extrusion-height": [
                    "interpolate", ["linear"], ["zoom"],
                    15, 0,
                    15.05, ["get", "height"]
                ],
                "fill-extrusion-base": [
                    "interpolate", ["linear"], ["zoom"],
                    15, 0,
                    15.05, ["get", "min_height"]
                ],
                "fill-extrusion-opacity": 0.6
            }
        },
        labelLayerId
    );
}



// =============== 3D MODELS (FROM 12_8, FIXED ORDERING) ===============
function add3DModels() {

    const THREE = window.THREE;
    const loader = new THREE.GLTFLoader();

    // SAME COORDS + FILES FROM 12_8
    const models = [
        {
            id: "solar-forebay-south",
            file: "assets/images/pond_pack.glb",
            coords: [-122.51472840835794, 37.96556501819977]
        },
        {
            id: "bench-nw",
            file: "assets/images/bench.glb",
            coords: [-122.51255653080607, 37.96784675899259]
        },
        {
            id: "closet-ne",
            file: "assets/images/closet.glb",
            coords: [-122.51172577538132, 37.96756766223187]
        }
    ];

    // Create a single custom 3D scene for all models
    models.forEach(model => {

        const mc = mapboxgl.MercatorCoordinate.fromLngLat(model.coords, 0);

        const customLayer = {
            id: model.id,
            type: "custom",
            renderingMode: "3d",

            onAdd: (map, gl) => {

                this.camera = new THREE.Camera();
                this.scene = new THREE.Scene();

                // LIGHT
                const light = new THREE.DirectionalLight(0xffffff, 1.2);
                light.position.set(100, 100, 200);
                this.scene.add(light);

                // LOAD GLB
                loader.load(model.file, (gltf) => {
                    const obj = gltf.scene;

                    // MATCH SCALE FROM 12_8 (1,1,1 with Mercator scaling)
                    const scale = mc.meterInMercatorCoordinateUnits();
                    obj.scale.set(scale, scale, scale);

                    this.scene.add(obj);
                });

                // SHARED RENDERER
                this.renderer = new THREE.WebGLRenderer({
                    canvas: map.getCanvas(),
                    context: gl,
                    antialias: true
                });
                this.renderer.autoClear = false;
            },

            render: (gl, matrix) => {

                const rotationX = new THREE.Matrix4()
                    .makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);

                const m = new THREE.Matrix4().fromArray(matrix);

                const l = new THREE.Matrix4()
                    .makeTranslation(mc.x, mc.y, mc.z)
                    .scale(new THREE.Vector3(
                        mc.meterInMercatorCoordinateUnits(),
                        -mc.meterInMercatorCoordinateUnits(),
                        mc.meterInMercatorCoordinateUnits()
                    ))
                    .multiply(rotationX);

                this.camera.projectionMatrix = m.multiply(l);

                this.renderer.state.reset();
                this.renderer.render(this.scene, this.camera);
                map.triggerRepaint();
            }
        };

        // IMPORTANT: 3D MODELS ABOVE POINTS
        map.addLayer(customLayer, "srcd-points-layer");
    });
}



// =============== ZOOM BUTTONS (UNCHANGED) ===============
document.getElementById("zoomRegion").onclick = () =>
  map.flyTo({
    center: SRCD_CENTER,
    zoom: map.getZoom() - 5,
    pitch: 60,
    bearing: -20,
    speed: 0.8
  });

document.getElementById("resetView").onclick = () =>
  map.flyTo({
    center: SRCD_CENTER,
    zoom: 17.5,
    pitch: 60,
    bearing: -20,
    speed: 0.8
  });
