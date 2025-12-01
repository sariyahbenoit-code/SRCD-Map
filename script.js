mapboxgl.accessToken =
'pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA';

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/standard",
    config: {
        basemap: { theme: "monochrome" }
    },
    center: [-122.5125, 37.9678], 
    zoom: 17,
    pitch: 60,
    bearing: 20,
    antialias: true
});

map.on("load", () => {
    map.addSource("sites", {
        type: "geojson",
        data: "data/619data.geojson"
    });

    map.addLayer({
        id: "site-points",
        type: "circle",
        source: "sites",
        paint: {
            "circle-radius": 10,
            "circle-color": "#ff5500",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff"
        }
    });

    map.on("click", "site-points", (e) => {
        const props = e.features[0].properties;
        const coords = e.features[0].geometry.coordinates;

        new mapboxgl.Popup()
            .setLngLat(coords)
            .setHTML(`
                <b>${props.Landmark}</b><br>
                ${props.Address}<br><br>
                <b>Proposal:</b><br>${props.Proposal}<br><br>
                ${props["Proposal Link"] ? `<img src="${props["Proposal Link"]}" width="200">` : ""}
            `)
            .addTo(map);
    });

    map.on("mouseenter", "site-points", () => map.getCanvas().style.cursor = "pointer");
    map.on("mouseleave", "site-points", () => map.getCanvas().style.cursor = "");

    add3DModel();
});

function add3DModel() {
    const modelOrigin = [-122.5125, 37.9678];
    const modelAltitude = 0;
    const modelRotate = [Math.PI / 2, 0, 0];

    const merc = mapboxgl.MercatorCoordinate.fromLngLat(modelOrigin, modelAltitude);

    const modelTransform = {
        translateX: merc.x,
        translateY: merc.y,
        translateZ: merc.z,
        rotateX: modelRotate[0],
        rotateY: modelRotate[1],
        rotateZ: modelRotate[2],
        scale: merc.meterInMercatorCoordinateUnits()
    };

    const THREECAM = new THREE.Camera();
    const scene = new THREE.Scene();

    const light1 = new THREE.DirectionalLight(0xffffff);
    light1.position.set(0, -70, 100).normalize();
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff);
    light2.position.set(0, 70, 100).normalize();
    scene.add(light2);

    const loader = new THREE.GLTFLoader();
    loader.load("https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/34M_17.gltf", (gltf) => {
        scene.add(gltf.scene);
    });

    const customLayer = {
        id: "3d-model",
        type: "custom",
        renderingMode: "3d",
        onAdd: (map, gl) => {
            this.renderer = new THREE.WebGLRenderer({
                canvas: map.getCanvas(),
                context: gl,
                antialias: true
            });
            this.renderer.autoClear = false;
        },
        render: (gl, matrix) => {
            const rotX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), modelTransform.rotateX);
            const rotY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), modelTransform.rotateY);
            const rotZ = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), modelTransform.rotateZ);

            const m = new THREE.Matrix4().fromArray(matrix);
            const l = new THREE.Matrix4()
                .makeTranslation(modelTransform.translateX, modelTransform.translateY, modelTransform.translateZ)
                .scale(new THREE.Vector3(modelTransform.scale, -modelTransform.scale, modelTransform.scale))
                .multiply(rotX)
                .multiply(rotY)
                .multiply(rotZ);

            THREECAM.projectionMatrix = m.multiply(l);
            this.renderer.resetState();
            this.renderer.render(scene, THREECAM);
            map.triggerRepaint();
        }
    };

    map.addLayer(customLayer);
}
