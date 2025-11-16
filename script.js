import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.150.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);

const loader = new GLTFLoader();
loader.load(
    'https://sariyahbenoit-code.github.io/SRCD-Map/assets/images/forebay%20gltf.gltf',
    function (gltf) {
        const model = gltf.scene;

        // Scale and position the model to fit your rectangle
        model.scale.set(0.00005, 0.00005, 0.00005);
        model.position.set(0, 0, 0);

        scene.add(model);
    },
    undefined,
    function (error) {
        console.error(error);
    }
);

camera.position.set(0, 1, 2);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
