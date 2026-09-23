import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createFallingPetals } from './falling-petals.js';

function fixture(){
  const scene=new THREE.Scene(),bouquet=new THREE.Group();scene.add(bouquet);
  bouquet.position.set(1,2,3);bouquet.rotation.y=.8;
  const geometry=new THREE.PlaneGeometry(.1,.3),material=new THREE.MeshBasicMaterial();
  const flowers=Array.from({length:15},()=>({petals:Array.from({length:40},(_,i)=>{
    const hinge=new THREE.Group();hinge.position.set(i*.01,1,0);bouquet.add(hinge);
    hinge.add(new THREE.Mesh(geometry,material));return {hinge};
  })}));
  return {scene,bouquet,flowers,geometry,material};
}
test('fallen petals retain world placement and stay independent of bouquet rotation',()=>{
  const {scene,bouquet,flowers}=fixture();
  const system=createFallingPetals(scene,flowers,true);
  assert.equal(system.release(),18);
  const detached=scene.children.filter(o=>o!==bouquet);
  assert.equal(detached.length,18);
  const sources=flowers.flatMap(f=>f.petals.map(p=>p.hinge.children[0])).filter(m=>!m.visible);
  for(const source of sources){const p=source.getWorldPosition(new THREE.Vector3());assert.ok(detached.some(m=>m.position.distanceTo(p)<1e-6));}
  const p=detached[0].position.clone();bouquet.rotation.y+=1;scene.updateMatrixWorld(true);
  assert.ok(detached[0].position.distanceTo(p)<1e-9);
  system.update(.1);assert.ok(detached[0].position.distanceTo(p)>0);
});
test('mobile drop limit, settling and complete reset preserve living model assets',()=>{
  const {scene,bouquet,flowers,geometry,material}=fixture();
  let disposed=false;geometry.addEventListener('dispose',()=>{disposed=true;});material.addEventListener('dispose',()=>{disposed=true;});
  const system=createFallingPetals(scene,flowers,true);
  for(let i=0;i<20;i++)system.release();
  assert.equal(scene.children.length-1,40);assert.equal(system.release(),0);
  for(const flower of flowers)assert.ok(flower.petals.filter(p=>!p.hinge.children[0].visible).length<=11);
  for(let i=0;i<300;i++)system.update(1/30);
  assert.ok(scene.children.filter(o=>o!==bouquet).every(m=>m.position.y===.06));
  system.reset();assert.equal(scene.children.length,1);assert.equal(disposed,false);
  assert.ok(flowers.every(f=>f.petals.every(p=>p.hinge.children[0].visible)));
});
