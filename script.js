mapboxgl.accessToken =
  "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/snbenoi/cmhjgr9hh000001rcf6cy38p0",
    center: [-122.5125, 37.9679],
    zoom: 19,
    pitch: 60,
    bearing: 0,
    antialias: true
});

const sidebarContent = document.getElementById("sidebar-content");

let labels = [];
let modelObjects = [];

map.on("load", () => {

    fetch("https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/data/619data.geojson?raw=1")
        .then(r => r.json())
        .then(geojson => {

            map.addSource("sites", { type: "geojson", data: geojson });

            map.addLayer({
                id: "sites-points",
                type: "circle",
                source: "sites",
                paint: {
                    "circle-radius": 10,
                    "circle-color": "#ff6600",
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#000"
                }
            });

            map.on("click", "sites-points", (e) => {
                const f = e.features[0];
                const p = f.properties;

                const html =
                    "<h3>" + p.Title + "</h3>" +
                    "<p>" + p.Description + "</p>" +
                    "<p>Coordinates: " + f.geometry.coordinates.join(", ") + "</p>";

                new mapboxgl.Popup()
                    .setLngLat(f.geometry.coordinates)
                    .setHTML(html)
                    .addTo(map);

                sidebarContent.innerHTML = html;
            });

            const feats = geojson.features.slice().sort((a, b) => a.geometry.coordinates[1] - b.geometry.coordinates[1]);

            const south = feats[0];
            const mid = feats[1];
            const north = feats[2];

            const west = mid.geometry.coordinates[0] < north.geometry.coordinates[0] ? mid : north;
            const east = mid.geometry.coordinates[0] > north.geometry.coordinates[0] ? mid : north;

            add3DModel(south, 
                "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/pond_pack.glb?raw=1",
                "model-south",
                "Solar Powered Forebay and Extended Marsh Edge"
            );

            add3DModel(west, 
                "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/bench.glb?raw=1",
                "model-west",
                "Multipurpose Seating"
            );

            add3DModel(east, 
                "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/closet.glb?raw=1",
                "model-east",
                "Storage units converted to Emergency Supply Inventory"
            );
        });

    document.getElementById("toggleSites").addEventListener("change", (e) => {
        map.setLayoutProperty("sites-points", "visibility", e.target.checked ? "visible" : "none");
    });

    document.getElementById("toggle3D").addEventListener("change", (e) => {
        const v = e.target.checked ? "visible" : "none";
        modelObjects.forEach(m => {
            if (map.getLayer(m.layerId)) {
                map.setLayoutProperty(m.layerId, "visibility", v);
            }
        });
    });

    document.getElementById("toggleLabels").addEventListener("change", (e) => {
        const v = e.target.checked ? "block" : "none";
        labels.forEach(lbl => lbl.style.display = v);
    });
});

function add3DModel(feature, url, layerId, labelText) {

    const lngLat = feature.geometry.coordinates;
    const mc = mapboxgl.MercatorCoordinate.fromLngLat(lngLat, 0);

    const transform = {
        x: mc.x,
        y: mc.y,
        z: mc.z,
        scale: mc.meterInMercatorCoordinateUnits() * 4
    };

    const camera = new THREE.Camera();
    const scene = new THREE.Scene();
    const loader = new THREE.GLTFLoader();
    let model = null;

    loader.load(url, (gltf) => {
        model = gltf.scene;
        model.traverse(o => {
            if (o.isMesh) o.userData.pickable = true;
        });
        scene.add(model);
    });

    const customLayer = {
        id: layerId,
        type: "custom",
        renderingMode: "3d",
        onAdd: function (map, gl) {
            this.renderer = new THREE.WebGLRenderer({
                canvas: map.getCanvas(),
                context: gl
            });
            this.renderer.autoClear = false;
        },
        render: function (gl, matrix) {
            if (!model) return;

            const m = new THREE.Matrix4().fromArray(matrix);
            const t = new THREE.Matrix4()
                .makeTranslation(transform.x, transform.y, transform.z)
                .scale(new THREE.Vector3(transform.scale, -transform.scale, transform.scale));

            camera.projectionMatrix = m.multiply(t);

            this.renderer.resetState();
            this.renderer.render(scene, camera);
            map.triggerRepaint();
        }
    };

    map.addLayer(customLayer);
    modelObjects.push({ layerId, model, feature });

    const label = document.createElement("div");
    label.className = "label-3d";
    label.innerText = labelText;
    document.body.appendChild(label);
    labels.push(label);

    map.on("render", () => {
        const screen = map.project(lngLat);
        label.style.left = screen.x + "px";
        label.style.top = screen.y + "px";
    });

    map.on("click", (e) => {
        if (!model) return;

        const mouse = new THREE.Vector2(
            (e.point.x / map.getCanvas().clientWidth) * 2 - 1,
            -(e.point.y / map.getCanvas().clientHeight) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(scene.children, true);

        if (hits.length > 0) {
            const p = feature.properties;
            const html =
                "<h3>" + p.Title + "</h3>" +
                "<p>" + p.Description + "</p>" +
                "<p>Coordinates: " + feature.geometry.coordinates.join(", ") + "</p>";

            sidebarContent.innerHTML = html;

            new mapboxgl.Popup()
                .setLngLat(feature.geometry.coordinates)
                .setHTML(html)
                .addTo(map);
        }
    });

    map.on("mousemove", (e) => {
        if (!model) return;

        const mouse = new THREE.Vector2(
            (e.point.x / map.getCanvas().clientWidth) * 2 - 1,
            -(e.point.y / map.getCanvas().clientHeight) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(scene.children, true);

        if (hits.length > 0) {
            model.traverse(o => {
                if (o.material && o.material.emissive) o.material.emissive.setHex(0xff8800);
            });
        } else {
            model.traverse(o => {
                if (o.material && o.material.emissive) o.material.emissive.setHex(0x000000);
            });
        }
    });
}
