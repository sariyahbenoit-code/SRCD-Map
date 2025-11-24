mapboxgl.accessToken = 'pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/standard',
    zoom: 12,
    center: [-122.51465, 37.96558],
    pitch: 60,
    antialias: true
});

fetch("data/619data.geojson")
.then(r => r.json())
.then(geojson => {
    map.on("load", () => {
        map.addSource("sites", { type: "geojson", data: geojson });

        map.addLayer({
            id: "sites-points",
            type: "circle",
            source: "sites",
            paint: {
                "circle-radius": 6,
                "circle-color": "#ff5500"
            }
        });

        map.on("mouseenter", "sites-points", () => {
            map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "sites-points", () => {
            map.getCanvas().style.cursor = "";
        });

        map.on("click", "sites-points", e => {
            const coords = e.features[0].geometry.coordinates;
            const props = e.features[0].properties;
            const html = `<h3>${props.name || "Site"}</h3><p>${props.description || ""}</p>`;
            new mapboxgl.Popup().setLngLat(coords).setHTML(html).addTo(map);
        });

        geojson.features.forEach((feature, index) => {
            add3D(feature, index);
        });
    });
});

function add3D(feature, index) {
    const coords = feature.geometry.coordinates;
    const mc = mapboxgl.MercatorCoordinate.fromLngLat(coords, 0);

    const rot = [Math.PI / 2, 0, 0];
    const transform = {
        tx: mc.x, ty: mc.y, tz: mc.z,
        rx: rot[0], ry: rot[1], rz: rot[2],
        s: mc.meterInMercatorCoordinateUnits()
    };

    const id = "model-" + index;

    const layer = {
        id: id,
        type: "custom",
        renderingMode: "3d",
        onAdd: function (map, gl) {
            this.camera = new THREE.Camera();
            this.scene = new THREE.Scene();

            const l1 = new THREE.DirectionalLight(0xffffff);
            l1.position.set(0, -70, 100).normalize();
            this.scene.add(l1);

            const l2 = new THREE.DirectionalLight(0xffffff);
            l2.position.set(0, 70, 100).normalize();
            this.scene.add(l2);

            const loader = new THREE.GLTFLoader();
            const modelPath = feature.properties.model || "assets/models/model" + (index + 1) + ".gltf";

            loader.load(modelPath, gltf => {
                gltf.scene.scale.set(1, 1, 1);
                this.scene.add(gltf.scene);
            });

            this.renderer = new THREE.WebGLRenderer({
                canvas: map.getCanvas(),
                context: gl,
                antialias: true
            });

            this.renderer.autoClear = false;
        },
        render: function (gl, matrix) {
            const rx = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1,0,0), transform.rx);
            const ry = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0,1,0), transform.ry);
            const rz = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0,0,1), transform.rz);

            const m = new THREE.Matrix4().fromArray(matrix);
            const l = new THREE.Matrix4()
                .makeTranslation(transform.tx, transform.ty, transform.tz)
                .scale(new THREE.Vector3(transform.s, -transform.s, transform.s))
                .multiply(rx).multiply(ry).multiply(rz);

            this.camera.projectionMatrix = m.multiply(l);
            this.renderer.resetState();
            this.renderer.render(this.scene, this.camera);
        }
    };

    map.addLayer(layer);
}
