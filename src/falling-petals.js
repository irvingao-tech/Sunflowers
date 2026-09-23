import * as THREE from 'three';

export function createFallingPetals(scene,flowers,lowPower){
  const originals=new Set(),falling=[];
  const limit=lowPower?40:64;
  function reset(){
    for(const source of originals)source.visible=true;
    originals.clear();
    for(const item of falling)scene.remove(item.mesh);
    falling.length=0;
  }
  function release(){
    if(falling.length>=limit)return 0;
    scene.updateMatrixWorld(true);
    let count=0;
    // Rotate the selection order so successive shakes don't favor the highest flowers.
    const order=[...flowers].sort(()=>Math.random()-.5);
    for(const flower of order){
      const meshes=flower.petals.map(p=>p.hinge.children[0]);
      const dropped=meshes.filter(m=>originals.has(m)).length;
      const allowed=Math.floor(meshes.length*.28)-dropped;
      if(allowed<=0)continue;
      const candidates=meshes.filter(m=>m.visible).sort(()=>Math.random()-.5);
      const take=Math.min(2,allowed,candidates.length,limit-falling.length);
      for(const source of candidates.slice(0,take)){
        const mesh=new THREE.Mesh(source.geometry,source.material);
        source.matrixWorld.decompose(mesh.position,mesh.quaternion,mesh.scale);
        mesh.castShadow=!lowPower;mesh.receiveShadow=true;
        scene.add(mesh);source.visible=false;originals.add(source);
        falling.push({mesh,age:0,phase:Math.random()*6.28,
          velocity:new THREE.Vector3((Math.random()-.5)*1.1,.3+Math.random()*.6,(Math.random()-.5)*.7),
          spin:new THREE.Vector3((Math.random()-.5)*3,(Math.random()-.5)*3,(Math.random()-.5)*3),
          rest:new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,Math.random()*6.28)),settled:false});
        count++;
      }
      if(count>=18||falling.length>=limit)break;
    }
    return count;
  }
  function update(dt){
    for(const item of falling){
      if(item.settled)continue;
      item.age+=dt;
      item.velocity.y=Math.max(-1.6,item.velocity.y-2.4*dt);
      item.mesh.position.addScaledVector(item.velocity,dt);
      item.mesh.position.x+=Math.sin(item.age*6+item.phase)*dt*.22;
      item.mesh.rotation.x+=item.spin.x*dt;item.mesh.rotation.y+=item.spin.y*dt;item.mesh.rotation.z+=item.spin.z*dt;
      if(item.mesh.position.y<.24){
        item.mesh.quaternion.slerp(item.rest,Math.min(1,dt*12));
        if(item.mesh.position.y<=.06){item.mesh.position.y=.06;item.mesh.quaternion.copy(item.rest);item.settled=true;}
      }
    }
  }
  // Geometry/material are shared with living petals; never dispose them here.
  return {release,reset,update};
}
