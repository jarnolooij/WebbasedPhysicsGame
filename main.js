import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { scene, camera, renderer, world } from './scene.js';
import { spawnD6, spawnCustomDice, diceArray, diceBodies } from './dice.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let draggedDice = null;
let isDragging = false;
let plane = new THREE.Plane(new THREE.Vector3(0,1,0),0);
let offset = new THREE.Vector3();

// Drag & click handlers (same as before)
function onPointerDown(event){ /* ... */ }
function onPointerMove(event){ /* ... */ }
function onPointerUp(event){ /* ... */ }

window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);

document.getElementById('spawnD6Btn').addEventListener('click', spawnD6);
document.getElementById('spawnCustomBtn').addEventListener('click', spawnCustomDice);

// Animate loop
const clock = new THREE.Clock();
function animate(){
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    world.step(1/60, delta);

    for(let i=diceArray.length-1;i>=0;i--){
        const dice = diceArray[i];
        const body = diceBodies[i];

        if(body.position.y < -50 || Math.abs(body.position.x)>200 || Math.abs(body.position.z)>200){
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
