import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

export function addStudioLighting(scene,renderer){
  RectAreaLightUniformsLib.init();
  scene.add(new THREE.HemisphereLight(0xffefd2,0x646557,.42));
  const key=new THREE.SpotLight(0xffe2a7,210,24,.49,.65,2);
  key.position.set(-3.8,8.2,5);key.target.position.set(0,2.6,0);
  key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.near=.5;key.shadow.camera.far=24;
  key.shadow.normalBias=.035;key.shadow.bias=-.00015;key.shadow.radius=3;
  scene.add(key,key.target);
  const fill=new THREE.RectAreaLight(0xd4e0ef,.65,4,5);fill.position.set(4,3,3);fill.lookAt(0,2.6,0);scene.add(fill);
  const rim=new THREE.RectAreaLight(0xffda9f,2.6,3,5);rim.position.set(2,5,-4);rim.lookAt(0,3,0);scene.add(rim);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x493921,opacity:.32}));
  ground.rotation.x=-Math.PI/2;ground.position.y=.025;ground.receiveShadow=true;scene.add(ground);
  // A faint, depth-tested atmospheric cone follows the actual spotlight direction.
  const end=new THREE.Vector3(.6,.2,-.8),axis=key.position.clone().sub(end),length=axis.length();
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.08,2.6,length,40,1,true),new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    uniforms:{tint:{value:new THREE.Color(0xffdfa0)}},
    vertexShader:`varying vec2 beamUv;varying vec3 beamNormal;varying vec3 beamView;
    void main(){beamUv=uv;vec4 p=modelViewMatrix*vec4(position,1.);beamNormal=normalize(normalMatrix*normal);beamView=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`,
    fragmentShader:`uniform vec3 tint;varying vec2 beamUv;varying vec3 beamNormal;varying vec3 beamView;
    void main(){float edge=pow(abs(dot(normalize(beamNormal),normalize(beamView))),1.5);
    float fade=smoothstep(0.,.22,beamUv.y)*(1.-smoothstep(.86,1.,beamUv.y));
    gl_FragColor=vec4(tint,.065*edge*fade);}`
  }));
  beam.position.copy(key.position).add(end).multiplyScalar(.5);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),axis.normalize());scene.add(beam);
}
