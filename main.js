import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { scene, camera, renderer, world } from './scenes/main_scene.js';
import { spawnD6, spawnCustomDice, diceArray, diceBodies } from './gameobjects/dice.js';

// -------------------------
// Inject Toolbox
// -------------------------
const toolboxContainer = document.createElement('div');
toolboxContainer.id = 'toolbox-container';
document.body.appendChild(toolboxContainer);

fetch('ui_elements/toolbox.html')
  .then(res => res.text())
  .then(html => {
    toolboxContainer.innerHTML = html;

    // --- Dice category toggle ---
    const diceCategory = document.getElementById('diceCategory');
    const diceContent = document.getElementById('diceContent');
    diceCategory.addEventListener('click', () => {
      diceContent.style.display = diceContent.style.display === 'block' ? 'none' : 'block';
    });

    // --- Modal controls ---
    const customModal = document.getElementById('customModal');
    const openCustomBtn = document.getElementById('openCustomBtn');
    const closeCustomBtn = document.getElementById('closeCustomBtn');
    const spawnCustomBtn = document.getElementById('spawnCustomBtn');

    openCustomBtn.addEventListener('click', () => customModal.style.display = 'flex');
    closeCustomBtn.addEventListener('click', () => customModal.style.display = 'none');
    spawnCustomBtn.addEventListener('click', () => {
      spawnCustomDice();
      customModal.style.display = 'none';
    });

    // --- D6 button ---
    document.getElementById('spawnD6Btn').addEventListener('click', spawnD6);
  });

// -------------------------
// Drag & Click Handling
// -------------------------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let draggedDice = null;
let isDragging = false;
let plane = new THREE.Plane(new THREE.Vector3(0,1,0),0);
let offset = new THREE.Vector3();

function getPointer(event){
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

function onPointerDown(event){
    getPointer(event);
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
    getPointer(event);
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

// -------------------------
// Animate
// -------------------------
const clock = new THREE.Clock();
function animate(){
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    world.step(1/60, delta);

    for(let i=diceArray.length-1; i>=0; i--){
        const dice = diceArray[i];
        const body = diceBodies[i];

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

// -------------------------
// Resize
// -------------------------
window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
