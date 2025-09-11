import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';
import { scene, world } from './scene.js';

export const diceArray = [];
export const diceBodies = [];

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

export function spawnDice(faces){
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
        mass:1,
        shape: boxShape,
        position: new CANNON.Vec3(dice.position.x, dice.position.y, dice.position.z),
        angularDamping:0.1,
        linearDamping:0.05
    });
    world.addBody(boxBody);
    diceBodies.push(boxBody);
}

export function spawnD6(){
    spawnDice(['1','2','3','4','5','6']);
}

export function spawnCustomDice(){
    const faces = [];
    for(let i=1;i<=6;i++){
        faces.push(document.getElementById(`face${i}`).value || i.toString());
    }
    spawnDice(faces);
}
