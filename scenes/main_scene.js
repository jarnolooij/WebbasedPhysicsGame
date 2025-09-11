import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x686868);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(65, 65, 65);
camera.lookAt(0,0,0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff,1);
dirLight.position.set(100,200,100);
dirLight.castShadow = true;
scene.add(dirLight);

// Physics world
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0,-50,0)
});
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 20;

// Field (visible green plane)
const fieldGeometry = new THREE.BoxGeometry(150,1,150);
const fieldMaterial = new THREE.MeshStandardMaterial({ color: 0x6aa84f });
const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
field.position.y = 0.5;
scene.add(field);

// Physics ground
const groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(75,0.5,75)),
    position: new CANNON.Vec3(0,0.5,0)
});
world.addBody(groundBody);

export { scene, camera, renderer, world };
