import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x686868);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(65, 65, 65);
camera.lookAt(0,0,0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff,1);
dirLight.position.set(100,200,100);
dirLight.castShadow = true;
scene.add(dirLight);

// Physics world
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -50, 0) // stronger gravity
});
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 20;

// Field
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

const diceArray = [];
const diceBodies = [];

// Helper: create dice face texture
function createFaceTexture(text){
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,256,256);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 150px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text,128,128);
    return new THREE.CanvasTexture(canvas);
}

function createDiceMaterial(text){
    return new THREE.MeshStandardMaterial({ map:createFaceTexture(text), color:0xffffff });
}

// Spawn dice
function spawnDice(faces){
    const diceSize = 7;
    const materials = faces.map(f=>createDiceMaterial(f));
    const geometry = new THREE.BoxGeometry(diceSize,diceSize,diceSize);
    const dice = new THREE.Mesh(geometry, materials);
    dice.position.set(Math.random()*20-10, 30, Math.random()*20-10);
    scene.add(dice);
    diceArray.push(dice);

    const half = diceSize/2;
    const boxShape = new CANNON.Box(new CANNON.Vec3(half,half,half));
    const boxBody = new CANNON.Body({
        mass: 1,
        shape: boxShape,
        position: new CANNON.Vec3(dice.position.x,dice.position.y,dice.position.z),
        angularDamping:0.1,
        linearDamping:0.05
    });
    world.addBody(boxBody);
    diceBodies.push(boxBody);
}

// Spawn D6
function spawnD6(){
    spawnDice(['1','2','3','4','5','6']);
}

// Spawn Custom Dice
function spawnCustomDice(){
    const faces = [];
    for(let i=1;i<=6;i++){
        faces.push(document.getElementById(`face${i}`).value || i.toString());
    }
    spawnDice(faces);
}

// Dragging & click handling
let draggedDice = null;
let isDragging = false;
let plane = new THREE.Plane(new THREE.Vector3(0,1,0),0);
let offset = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onPointerDown(event){
    mouse.x = (event.clientX / window.innerWidth)*2 - 1;
    mouse.y = - (event.clientY / window.innerHeight)*2 + 1;
    raycaster.setFromCamera(mouse,camera);
    const intersects = raycaster.intersectObjects(diceArray);
    if(intersects.length>0){
        draggedDice = intersects[0].object;
        isDragging = false;
        const idx = diceArray.indexOf(draggedDice);
        const bodyPos = diceBodies[idx].position;
        plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0,1,0), new THREE.Vector3(bodyPos.x, bodyPos.y, bodyPos.z));
        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersectPoint);
        offset.subVectors(draggedDice.position, intersectPoint);
    }
}

function onPointerMove(event){
    if(!draggedDice) return;
    isDragging = true;
    mouse.x = (event.clientX / window.innerWidth)*2 - 1;
    mouse.y = - (event.clientY / window.innerHeight)*2 + 1;
    raycaster.setFromCamera(mouse,camera);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);
    const idx = diceArray.indexOf(draggedDice);
    diceBodies[idx].position.set(intersectPoint.x+offset.x, intersectPoint.y+offset.y, intersectPoint.z+offset.z);
    diceBodies[idx].velocity.set(0,0,0);
    diceBodies[idx].angularVelocity.set(0,0,0);
}

function onPointerUp(event){
    if(draggedDice){
        const idx = diceArray.indexOf(draggedDice);
        if(!isDragging){
            // clicked without dragging -> jump higher
            diceBodies[idx].velocity.set(0,40,0); // higher jump
            diceBodies[idx].angularVelocity.set(Math.random()*15-7.5, Math.random()*15-7.5, Math.random()*15-7.5);
        } else {
            // dragged -> small random spin
            diceBodies[idx].angularVelocity.set(Math.random()*5-2.5, Math.random()*5-2.5, Math.random()*5-2.5);
        }
    }
    draggedDice = null;
    isDragging = false;
}

window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);

// Animate
const clock = new THREE.Clock();
function animate(){
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    world.step(1/60, delta);

    // Sync mesh with physics
    for(let i=diceArray.length-1; i>=0; i--){ // iterate backwards to safely remove
        const dice = diceArray[i];
        const body = diceBodies[i];

        // Remove dice if below -50 or too far from center
        if(body.position.y < -50 || Math.abs(body.position.x) > 200 || Math.abs(body.position.z) > 200){
            scene.remove(dice);
            world.removeBody(body);
            diceArray.splice(i,1);
            diceBodies.splice(i,1);
            continue;
        }

        dice.position.copy(body.position);
        dice.quaternion.copy(body.quaternion);
    }

    renderer.render(scene,camera);
}
animate();

// Buttons
document.getElementById('spawnD6Btn').addEventListener('click', spawnD6);
document.getElementById('spawnCustomBtn').addEventListener('click', spawnCustomDice);

// Resize
window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});