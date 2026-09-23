import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { buildArtwork } from './artwork.js';
import { advanceProgress, orbitAngle, orbitPosition, smoothstep as ease } from './animation.js';
import './style.css';

const $=id=>document.getElementById(id),stage=$('stage');
const dialog=$('reference-dialog');
$('reference').onclick=()=>dialog.showModal();$('close-dialog').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}
catch{$('loading').textContent='当前浏览器无法显示三维画面，请使用支持 WebGL 的浏览器。你仍可查看原画。';}
if(renderer)init();
function init(){
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
  stage.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','向日葵三维场景，拖动旋转，滚轮或双指缩放');
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,100);
  RectAreaLightUniformsLib.init();
  scene.add(new THREE.HemisphereLight(0xfff3d6,0xa09c7e,1.1));
  const key=new THREE.RectAreaLight(0xffe8bc,3,5,7);key.position.set(-4,6,6);key.lookAt(0,2.6,0);scene.add(key);
  const fill=new THREE.RectAreaLight(0xe1e9f1,1.4,5,6);fill.position.set(4,3,2);fill.lookAt(0,2.5,0);scene.add(fill);
  const rimLight=new THREE.RectAreaLight(0xffd994,2.2,4,6);rimLight.position.set(1,5,-5);rimLight.lookAt(0,3,0);scene.add(rimLight);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const sun=new THREE.DirectionalLight(0xffe2af,.75);sun.position.set(-3,7,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-4;sun.shadow.camera.right=4;sun.shadow.camera.top=7;sun.shadow.camera.bottom=-3;sun.shadow.normalBias=.03;sun.shadow.bias=-.0002;sun.shadow.radius=4;scene.add(sun);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x64552d,opacity:.16}));ground.rotation.x=-Math.PI/2;ground.position.y=.025;ground.receiveShadow=true;scene.add(ground);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;
  controls.minDistance=8;controls.maxDistance=18;controls.minPolarAngle=.4;controls.maxPolarAngle=1.8;controls.autoRotateSpeed=.7;
  let progress=1,playing=false,speed=1,elapsed=0,orbit=null;
  function resetCamera(){camera.position.set(0,3.05,12.5);controls.target.set(0,2.85,0);controls.update();}
  resetCamera();
  const {flowers}=buildArtwork(scene);
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phases=[['初见绿意','一点新绿，悄悄探出陶瓶。<br/>阳光下，故事才刚刚开始。','萌芽'],['向光生长','花茎向上，绿叶渐渐舒展。<br/>每一寸生长，都朝着光的方向。','生长'],['静候花开','花瓣渐开，视角随之环绕。<br/>看见画面背后的另一面。','含苞'],['向阳盛放','金黄、赭褐与橄榄绿交织。<br/>盛放与低垂，在同一刻相遇。','盛放']];
  function updateUI(){const n=progress<.2?0:progress<.45?1:progress<.76?2:3;$('phase-name').textContent=phases[n][0];$('phase-description').innerHTML=phases[n][1];$('phase-number').textContent=`0${n+1}`;$('progress-label').textContent=`${Math.round(progress*100)}% · ${phases[n][2]}`;$('progress').value=progress*100;}
  function setPlaying(value){playing=value;$('play').textContent=playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',playing?'暂停生长动画':'播放生长动画');}
  function stopAutoRotate(){controls.autoRotate=false;$('rotate').setAttribute('aria-pressed','false');}
  function captureOrbit(){
    controls.enableDamping=false;controls.update();controls.enableDamping=true;
    const offset=camera.position.clone().sub(controls.target);
    orbit={radius:Math.hypot(offset.x,offset.z),height:camera.position.y,start:Math.atan2(offset.x,offset.z)-orbitAngle(progress),target:controls.target.clone()};
  }
  $('play').onclick=()=>{
    if(playing){setPlaying(false);return;}
    if(progress>=1){progress=0;orbit=null;}
    stopAutoRotate();if(!orbit)captureOrbit();setPlaying(true);updateUI();
  };
  function seek(value){progress=value;setPlaying(false);orbit=null;updateUI();}
  $('progress').oninput=e=>seek(Number(e.target.value)/100);
  document.querySelectorAll('[data-progress]').forEach(button=>button.onclick=()=>seek(Number(button.dataset.progress)/100));
  $('speed').onclick=()=>{speed=speed===1?2:speed===2?.5:1;$('speed').textContent=`${speed}×`;};
  $('rotate').onclick=()=>{setPlaying(false);orbit=null;controls.autoRotate=!controls.autoRotate;$('rotate').setAttribute('aria-pressed',String(controls.autoRotate));};
  $('reset').onclick=()=>{setPlaying(false);orbit=null;stopAutoRotate();resetCamera();};
  controls.addEventListener('start',()=>{setPlaying(false);orbit=null;stopAutoRotate();});
  function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=Math.max(32,THREE.MathUtils.radToDeg(2*Math.atan(3.35/(12.5*camera.aspect))));camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(stage);resize();$('loading').remove();updateUI();
  let last=0;
  renderer.setAnimationLoop(time=>{
    const dt=Math.min((time-last)/1000,.25);last=time;if(document.hidden)return;elapsed+=dt;
    if(playing){
      progress=advanceProgress(progress,dt,speed);
      if(orbit){const p=orbitPosition(orbit.radius,orbit.height,orbit.start,orbitAngle(progress),orbit.target);camera.position.set(p.x,p.y,p.z);}
      if(progress>=1){setPlaying(false);orbit=null;}
      updateUI();
    }
    flowers.forEach((f,i)=>{
      const p=Math.max(0,progress-f.delay*(1-progress));
      const growth=.055+.945*ease(0,.49,p);f.root.scale.set(.4+growth*.6,growth,.4+growth*.6);
      f.head.scale.setScalar(.18+.82*ease(.2,.64,p));
      const bloom=ease(.45,.98,p);f.disk.scale.setScalar(.18+.82*bloom);f.disk.visible=p>.36&&!f.hideDisk;
      f.bud.scale.setScalar(Math.max(.001,1-bloom));f.bud.visible=bloom<.98;
      f.petals.forEach(({hinge,offset,curl})=>{const opened=ease(.43+offset,.96+offset*.2,p);hinge.rotation.x=1.47*(1-opened)+curl*opened;hinge.scale.setScalar(.2+.8*ease(.3,.79,p));});
      f.leaves.forEach((leaf,k)=>leaf.scale.setScalar(ease(.04+k*.07,.4+k*.04,p)));
      f.root.rotation.z=reducedMotion?0:Math.sin(elapsed*.7+i*1.4)*.004*growth;
    });
    controls.update();renderer.render(scene,camera);
  });
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();setPlaying(false);const warning=document.createElement('p');warning.id='loading';warning.textContent='三维画面已暂停，请刷新页面重新加载。';stage.appendChild(warning);});
}
