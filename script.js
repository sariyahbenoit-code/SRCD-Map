// ------------------------------
// MAPBOX SETUP
// ------------------------------

mapboxgl.accessToken =
  "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/snbenoi/cmhjgr9hh000001rcf6cy38p0",
    center: [-122.5125, 37.9679],
    zoom: 13,
    pitch: 60,
    bearing: 0,
    antialias: true
});

// Add compass + tilt control
map.addControl(
    new mapboxgl.NavigationControl({
        visualizePitch: true,
        showCompass: true
    }),
    "top-right"
);

map.on("load", () => {

    // ------------------------------
    // RASTER OVERLAYS
    // ------------------------------

    const corners = [
        [-122.537464, 37.984078],
        [-122.477353, 37.984108],
        [-122.477370, 37.952203],
        [-122.537475, 37.952208]
    ];

    const underUrl =
        "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/SFCD%20underground.jpg";
    const surfaceUrl =
        "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/SRCD%20surface.jpg";

    map.addSource("under-image", {
        type: "image",
        url: underUrl,
        coordinates: corners
    });

    map.addLayer({
        id: "under-layer",
        type: "raster",
        source: "under-image",
        paint: { "raster-opacity": 1 }
    });

    // ------------------------------
    // LANDMARK POINTS
    // ------------------------------

    const landmarks = {
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                properties: {
                    title: "Floating Housing",
                    address: "555 Francisco Blvd E, San Rafael, CA 94901",
                    proposal:
                        "Teiger Island precedent floating homes to replace liveaboard homes in the harbor",
                    image:
                        "https://riyahniko.com/wp-content/uploads/2025/11/Screenshot-2025-11-03-at-9.43.05-AM.png"
                },
                geometry: { type: "Point", coordinates: [-122.5036, 37.972] }
            },
            {
                type: "Feature",
                properties: {
                    title: "Municipally Leased Storage",
                    address: "616 Canal St, San Rafael, CA 94901",
                    proposal:
                        "San Rafael can lease space in this storage facility for emergency supplies.",
                    image:
                        "https://riyahniko.com/wp-content/uploads/2025/11/Screenshot-2025-11-03-at-9.42.42-AM.png"
                },
                geometry: { type: "Point", coordinates: [-122.5078, 37.9694] }
            },
            {
                type: "Feature",
                properties: {
                    title: "Solar Powered Pump Station",
                    address: "555 Francisco Blvd W, San Rafael, CA 94901",
                    proposal:
                        "Vegetated and riprap forebay with solar pumping capacity.",
                    image:
                        "https://riyahniko.com/wp-content/uploads/2025/11/fisheye-after-2048x1536.jpeg"
                },
                geometry: { type: "Point", coordinates: [-122.5115, 37.9675] }
            }
        ]
    };

    map.addSource("landmarks", { type: "geojson", data: landmarks });

    map.addLayer({
        id: "landmarks-layer",
        type: "circle",
        source: "landmarks",
        paint: {
            "circle-radius": 8,
            "circle-color": "#ffffff",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#000000"
        }
    });

    map.on("click", "landmarks-layer", (e) => {
        const f = e.features[0];
        const p = f.properties;

        const html = `
            <h3>${p.title}</h3>
            <p><strong>Address:</strong> ${p.address}</p>
            <p>${p.proposal}</p>
            <img src="${p.image}">
        `;

        new mapboxgl.Popup()
            .setLngLat(f.geometry.coordinates)
            .setHTML(html)
            .addTo(map);
    });

    map.on("mouseenter", "landmarks-layer", () => {
        map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "landmarks-layer", () => {
        map.getCanvas().style.cursor = "";
    });

    // ------------------------------
    // HALO REVEAL CANVAS
    // ------------------------------

    const surfaceCanvas = document.getElementById("surfaceCanvas");
    const ctx = surfaceCanvas.getContext("2d", { alpha: true });

    const surfaceImg = new Image();
    surfaceImg.crossOrigin = "anonymous";
    surfaceImg.src = surfaceUrl;

    let mouse = { x: -9999, y: -9999 };
    let haloRadius = 100;

    function resizeCanvas() {
        surfaceCanvas.width = map.getContainer().clientWidth;
        surfaceCanvas.height = map.getContainer().clientHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    map.getCanvasContainer().addEventListener("mousemove", (e) => {
        const rect = surfaceCanvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    function getScreenCoords() {
        const tl = map.project(corners[0]);
        const tr = map.project(corners[1]);
        const bl = map.project(corners[3]);
        return { tl, tr, bl };
    }

    function drawSurface() {
        if (!surfaceImg.complete) return;
        const w = surfaceCanvas.width;
        const h = surfaceCanvas.height;

        ctx.clearRect(0, 0, w, h);

        const { tl, tr, bl } = getScreenCoords();
        const drawW = tr.x - tl.x;
        const drawH = bl.y - tl.y;

        ctx.save();
        ctx.translate(tl.x, tl.y);
        ctx.drawImage(surfaceImg, 0, 0, drawW, drawH);

        ctx.globalCompositeOperation = "destination-out";
        const g = ctx.createRadialGradient(
            mouse.x,
            mouse.y,
            haloRadius * 0.5,
            mouse.x,
            mouse.y,
            haloRadius
        );
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, haloRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = "source-over";
        ctx.restore();
    }

    function animateCanvas() {
        drawSurface();
        requestAnimationFrame(animateCanvas);
    }
    animateCanvas();

    // ------------------------------
    // THREE.JS 3D MODEL
    // ------------------------------

    // Load model using global THREE + global GLTFLoader
    const loader = new THREE.GLTFLoader();
    loader.load(
        "https://sariyahbenoit-code.github.io/SRCD-Map/assets/images/forebay%20gltf.gltf",
        (gltf) => {
            const model = gltf.scene;

            model.scale.set(0.00005, 0.00005, 0.00005);

            // Centering on your coordinates:
            // (122.5125, 37.9679)
            model.position.set(0, 0, 0);

            console.log("3D model loaded.");
        },
        undefined,
        (err) => console.error("GLTF load error:", err)
    );
});
