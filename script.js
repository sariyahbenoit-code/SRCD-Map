mapboxgl.accessToken = 'pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/standard',
    config: { basemap: { theme: 'monochrome' }},
    zoom: 12,
    center: [-122.51465, 37.96558],
    pitch: 60,
    antialias: true
});

fetch("data/619data.geojson")
.then(response => response.json())
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
            const coords = e.features[0].geometry.coordinates.slice();
            const props = e.features[0].properties;
            const content = `<h3>${props.name || "Site"}</h3><p>${props.description || ""}</p>`;
            new mapboxgl.Popup({ closeButton: true, closeOnClick: true })
                .setLngLat(coords)
                .setHTML(content)
                .addTo(map);
        });

        geojson.features.forEach((feature, index) => {
            add3DModelAtPoint(feature, index);
        });
    });
});

function add3DModelAtPoint(feature, index) {
    const lngLat = feature.geometry.coordinates;
    const mc = mapboxgl.MercatorCoordinate.fromLngLat(lngLat, 0);
    const rotation = [Math.PI / 2, 0, 0];

    const transform = {
        translateX: mc.x,
        translateY: mc.y,
        translateZ: mc.z,
        rotateX: rotation[0],
        rotateY: rotation[1],
        rotateZ: rotation[2],
        scale: mc.meterInMercatorCoordinateUnits()
    };

    const layerID = "3d-model-" + index;

    const customLayer = {
        id: layerID,
        type: "custom",
        renderingMode: "3d",
        onAdd: function (map, gl) {
            this.camera = new THREE.Camera();
            this.scene = new THREE.Scene();
            const light1 = new THREE.DirectionalLight(0xffffff);
            light1.position.set(0, -70, 100).normalize();
            this.scene.add(light1);
            const light2 = new THREE.DirectionalLight(0xffffff);
            light2.position.set(0, 70, 100).normalize();
            this.scene.add(light2);

            const loader = new THREE.GLTFLoader();
            const modelPath = feature.properties.model || "assets/models/model" + (index + 1) + ".gltf";

            loader.load(modelPath, gltf => {
                gltf.scene.scale.set(1, 1, 1);
                this.scene.add(gltf.scene);
            });

            this.map = map;

            this.renderer = new THREE.WebGLRenderer({
                canvas: map.getCanvas(),
                context: gl,
                antialias: true
            });

            this.renderer.autoClear = false;
        },
        render: function (gl, matrix) {
            const rotationX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1,0,0), transform.rotateX);
            const rotationY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0,1,0), transform.rotateY);
            const rotationZ = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0,0,1), transform.rotateZ);

            const m = new THREE.Matrix4().fromArray(matrix);
            const l = new THREE.Matrix4()
                .makeTranslation(transform.translateX, transform.translateY, transform.translateZ)
                .scale(new THREE.Vector3(transform.scale, -transform.scale, transform.scale))
                .multiply(rotationX)
                .multiply(rotationY)
                .multiply(rotationZ);

            this.camera.projectionMatrix = m.multiply(l);
            this.renderer.resetState();
            this.renderer.render(this.scene, this.camera);
            map.triggerRepaint();
        }
    };

    map.addLayer(customLayer);
}
