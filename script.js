mapboxgl.accessToken =
    "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/standard",
    config: { basemap: { theme: "monochrome" } },
    center: [-122.513922, 37.966597], 
    zoom: 17.5,
    pitch: 60,
    antialias: true
});

map.on("load", () => {


    fetch("data/619data.geojson")
        .then(r => r.json())
        .then(geojson => {

            map.addSource("srcd-points", {
                type: "geojson",
                data: geojson
            });

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
            });

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

            add3DModels();
        });

});
    
// 3D MODELS

function add3DModels() {
    const THREE = window.THREE;
    const loader = new THREE.GLTFLoader();

    const models = [
        {
            id: "solar-forebay-south",
            file: "assets/images/pond_pack.glb",
            coords: [-122.51472840835794, 37.96556501819977] // SOUTH
        },
        {
            id: "bench-nw",
            file: "assets/images/bench.glb",
            coords: [-122.51255653080607, 37.96784675899259] // NW
        },
        {
            id: "closet-ne",
            file: "assets/images/closet.glb",
            coords: [-122.51172577538132, 37.96756766223187] // NE
        }
    ];

    models.forEach(model => {
        const mc = mapboxgl.MercatorCoordinate.fromLngLat(model.coords, 0);

        const transform = {
            translateX: mc.x,
            translateY: mc.y,
            translateZ: mc.z,
            rotateX: Math.PI / 2,
            rotateY: 0,
            rotateZ: 0,
            scale: mc.meterInMercatorCoordinateUnits()
        };

        const customLayer = {
            id: model.id,
            type: "custom",
            renderingMode: "3d",

            onAdd: (map, gl) => {
                this.camera = new THREE.Camera();
                this.scene = new THREE.Scene();

                const light1 = new THREE.DirectionalLight(0xffffff, 1);
                light1.position.set(0, -70, 100).normalize();
                this.scene.add(light1);

                const light2 = new THREE.DirectionalLight(0xffffff, 1);
                light2.position.set(0, 70, 100).normalize();
                this.scene.add(light2);

                loader.load(model.file, (gltf) => {
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

            render: (gl, matrix) => {
                const rotationX = new THREE.Matrix4().makeRotationAxis(
                    new THREE.Vector3(1, 0, 0),
                    transform.rotateX
                );

                const rotationY = new THREE.Matrix4().makeRotationAxis(
                    new THREE.Vector3(0, 1, 0),
                    transform.rotateY
                );

                const rotationZ = new THREE.Matrix4().makeRotationAxis(
                    new THREE.Vector3(0, 0, 1),
                    transform.rotateZ
                );

                const m = new THREE.Matrix4().fromArray(matrix);
                const l = new THREE.Matrix4()
                    .makeTranslation(transform.translateX, transform.translateY, transform.translateZ)
                    .scale(
                        new THREE.Vector3(
                            transform.scale,
                            -transform.scale,
                            transform.scale
                        )
                    )
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
    });
}
