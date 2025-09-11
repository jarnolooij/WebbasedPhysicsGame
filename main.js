import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { scene, camera, renderer, world } from './scene.js';
import { spawnD6, spawnCustomDice, diceArray, diceBodies } from './dice.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let draggedDice = null;
let isDragging = false;
let plane = new THREE.Plane(new THREE.Vector3(0,1,0),0);
let offset = new THREE.Vector3();

function onPointerDown(event){
    mouse.x = (event.clientX / window.innerWidth) * 2 -1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 +1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(diceArray);
    if(intersects.length > 0){
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
    mouse.x = (event.clientX / window.innerWidth) * 2 -1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 +1;
    raycaster.setFromCamera(mouse, camera);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);
    const idx = diceArray.indexOf(draggedDice);
    diceBodies[idx].position.set(intersectPoint.x + offset.x, intersectPoint.y + offset.y, intersectPoint.z + offset.z);
    diceBodies[idx].velocity.set(0,0,0);
    diceBodies[idx].angularVelocity.set(0,0,0);
}

function onPointerUp(event){
    if(draggedDice){
        const idx = diceArray.indexOf(draggedDice);
        if(!isDragging){
            // clicked without dragging -> jump/spin
            diceBodies[idx].velocity.set(0,40,0);
            diceBodies[idx].angularVelocity.set(Math.random()*15-7.5, Math.random()*15-7.5, Math.random()*15-7.5);
        } else {
            diceBodies[idx].angularVelocity.set(Math.random()*5-2.5, Math.random()*5-2.5, Math.random()*5-2.5);
        }
    }
    draggedDice = null;
    isDragging = false;
}

window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);

// Buttons
document.getElementById('spawnD6Btn').addEventListener('click', spawnD6);
document.getElementById('spawnCustomBtn').addEventListener('click', spawnCustomDice);

// Animate
const clock = new THREE.Clock();
function animate(){
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    world.step(1/60, delta);

    for(let i=diceArray.length-1; i>=0; i--){
        const dice = diceArray[i];
        const body = diceBodies[i];

        // Remove dice out of bounds
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

    renderer.render(scene, camera);
}
animate();
